/**
 * The FeedVal 2012 grid.
 * 
 * Author (1): ???                             // 01/01/2012
 * Author (2): Ajmain Naqib (naqib@wisc.edu)  // 08/01/2018
 */

var toolState = 'optimizer';
var solutionStore;

var feedvalGrid = {
    grid: {},
    nutrients: null,
    requiredColumns: ['Selected', 'DM', 'Price_Unit', 'Unit', 'Predicted_Value', 'Actual_Price'],
    invalidSelectionModal: null,
    ajaxErrorModal: null,
    nutrientsSelectBox: null,
    checkbox: null,
    gridview: true,


    /**
     * Gets the number of all the Nutrients.
     */

    getNumberOfNutrients: function () {
        return $.map(feedvalGrid.nutrients, function (element) {
            return element;
        }).length;
    },

    /**
     * Converts units of the ingredient passsed but submitting ajax request containing two properties
     * 
     * param ing ingredient
     * 
     * return ajax request containing 
     * TODO: maybe consider removing. since this can also just be done in javascript instead of ajax
     * NOTE: performs an AJAX request, to convert using PHP. 
     */
    convertUnits: function (ing) {
        console.log("convertUnits method is called, ing: " + ing);
        var ingredients;
        if (ing.ingredientName !== undefined) {
            ingredients = [ing];
        } else {
            ingredients = ing;
        }
        return $.ajax({
            data: {
                ingredients: ingredients,
                convertUnits: true
            },
            type: 'POST',
            dataType: 'json',

        //     success: function(converted){
        //         console.log("Data from convert Units:" + converted);
        // }
        })
            
        
    },

    /*
     * Returns true or false if only RUP and RDP (Nutrients ) are  selected.
     * 
     * return boolean
     * TODO: I don't think this method does anything important. Consider removing
     */
    onlyRupRdpSelected: function () {
        console.log("onlyRupRdpSelected method is called");
        var selectedNutrients;
        selectedNutrients = feedvalGrid.getSelectedNutrients();
        return selectedNutrients.length == 2 &&
            $.grep(selectedNutrients, function (nutrient) {
                return nutrient.indexOf('RUP') >= 0 ||
                    nutrient.indexOf('RDP') >= 0;
            }).length == 2;
    },


    /*
     * Returns array of selected nutrients that aren't present in any selected feed.
     * 
     * return array
     * TODO: I don't think this method does anything important. Consider removing since all the feed contains the same nutients.
     * Note: might be for future implementation
     */
    getSelectedNutrientsNotPresentInAnySelectedFeed: function () {
        console.log("getSelectedNutrientsNotPresentInAnySelectedFeed method is called");
        var selectedIngredientIDs, selectedNutrients, nutrientCoefficientMatrix, matrixColumnNumber,
            nutrientCoefficients, allZeroes, selectedNutrientNotPresentInAnySelectedFeed = [];

        selectedIngredientIDs = feedvalGrid.getSelectedIngredientIDs();
        //console.log(selectedIngredientIDs)
        selectedNutrients = feedvalGrid.getSelectedNutrients();
        nutrientCoefficientMatrix = feedvalGrid.getNutrientCoefficientMatrix(selectedIngredientIDs);

        $.each(selectedNutrients, function (columnIndex, nutrientName) {
            matrixColumnNumber = columnIndex + 1;
            nutrientCoefficients = nutrientCoefficientMatrix.col(matrixColumnNumber).elements;
            allZeroes = !nutrientCoefficients.reduce(function (previous, current) {
                return previous || current;
            });
            if (allZeroes) {
                selectedNutrientNotPresentInAnySelectedFeed.push(nutrientName);
            }
        });

        return selectedNutrientNotPresentInAnySelectedFeed;
    },

    /*
     * Returns true or false if CP is selected and RUP or RDP (Nutients) are selected
     * 
     * return boolean
     * 
     * TODO: I don't think this method does anything important. Consider removing since all the feed contains the same nutients.
     * Note: might be for future implementation
     */
    cpSelectedWithRupOrRdp: function () {
        console.log("cpSelectedWithRupOrRdp method is called");
        var selectedNutrients;
        selectedNutrients = feedvalGrid.getSelectedNutrients();
        return $.grep(selectedNutrients, function (nutrient) {
                return nutrient.indexOf('CP') >= 0;
            }).length == 1 &&
            $.grep(selectedNutrients, function (nutrient) {
                return nutrient.indexOf('RUP') >= 0 ||
                    nutrient.indexOf('RDP') >= 0;
            }).length >= 1;
    },

    /*
     * Returns array of ids containting the id of the ingredietnts that are seleceted in the grid
     * 
     * return array containing ids
     */
    getSelectedIngredientIDs: function () {
        return this.grid.jqGrid('getGridParam', 'selarrrow');
    },

    /*
     * Returns array of ids containting the id of the ingredietnts that are not seleceted in the grid
     * 
     * return array containing ids
     */
    getNonSelectedIngredientIDs: function () {
        var allIngredientIDs, selectedIngredientIDs, NonSelectedIngredientIDs = [];
        selectedIngredientIDs = this.grid.jqGrid('getGridParam', 'selarrrow');
        allIngredientIDs = this.grid.jqGrid('getDataIDs');

        $.each(allIngredientIDs, function (index, ingredientID) {
            var hits = 0;
            $.each(selectedIngredientIDs, function (selIndex, selIngredientID) {
                if (ingredientID == selIngredientID) {
                    hits++;
                }
            });
            if (hits == 0) {
                NonSelectedIngredientIDs.push(ingredientID);
            }

        });
        return NonSelectedIngredientIDs;
    },

    /*
     * Returns array of nutrients that are seleceted in the grid model
     * 
     * return array containing nutrients
     */
    getSelectedNutrients: function () {
        console.log("getSelectedNutrients method is called");
        var colModel, selectedNutrients = [];
        colModel = this.grid.jqGrid('getGridParam', 'colModel');
        $.each(colModel, function (colIndex, col) {
            if ((col.hidden == false) && (col.hidedlg == false)) {
                selectedNutrients.push(this.name);
            }
        });
        return selectedNutrients;
    },


    /*
     *Returns prices of the feed to Kg
     * Modifies each ingredient object and initializes their properties of name, id, price, fromUnit (Unit column) and toUnit.
     * converting to Kg. ?
     *
     * param ingredientIDs array of IDs
     * 
     * TODO: Question for Professor: Price of the feed should be dependent on the Unit column ?
     * Note: fromUnit(Unit column) and toUnit(kg) significance
     */
    getFeedPrices: function (ingredientIDs) {
        console.log("getFeedPrices method is called");
        var ingredients = [];
        $.each(ingredientIDs, function (index, ingredientID) {
            ingredients[index] = {
                ingredientName: feedvalGrid.getCell(ingredientID, 'Ingredient'),
                ingredientID: ingredientID,
                price: feedvalGrid.getCell(ingredientID, 'Price_Unit'),
                fromUnit: feedvalGrid.getUnit(ingredientID),
                toUnit: 'Kg'
            };
        });

        return feedvalGrid.convertUnits(ingredients);
    },

    /*
     *Returns units of an ingredient from Unit column of the grid
     *
     * param ingredientID int
     * 
     * returns unit of the Ingredient for price/Unit from Grid
     * 
     */
    getUnit: function (ingredientID) {
        return $('tr#' + ingredientID).find('select.unit').val();
    },

    /*
     *Returns cell data of an ingredient from any columnName given
     * If contains '%', then gives decimal value
     *
     * param ingredientID int
     * param columnName string
     * return cellValue string
     */
    getCell: function (ingredientID, columnName) {
        var cellValue, colLabel;
        cellValue = feedvalGrid.grid.jqGrid('getCell', ingredientID, columnName);
        colLabel = feedvalGrid.grid.jqGrid('getColProp', columnName).label;
        if (colLabel != undefined && colLabel.indexOf('%') >= 0) {
            return parseFloat(cellValue) / 100;
        } else {
            return cellValue;
        }
    },

    /*
     *Returns array of (dmValue * amountProvided) of given ingredients
     *
     * param ingredientIDs array
     * return array containting(dmValue * amountProvided)
     * TODO: check if it's better if the array's sum is returned based on where they are called since thats what dotProduct means. 
     */
    getDmDotAmountProvided: function (ingredientIDs) {
        var dotProduct = [];
        var dmValue = 0;
        var amountProvided = 0;

        $.each(ingredientIDs, function (ingredientIndex, ingredientID) {
            dmValue = feedvalGrid.grid.jqGrid('getCell', ingredientID, "DM");

            if (toolState == 'evaluator') {
                amountProvided = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, "Min_kgcowd"));
            } else {
                amountProvided = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, "Predicted_Value"));
            }

            dotProduct[ingredientIndex] = dmValue * amountProvided;
        });
        return dotProduct;
    },


    /*
     * Computes for the dot product of given columns. 
     * 
     * NOTE: if you are calculating using DM, must use as second param so percentage
     * 
     * param ingredientIDs array containing ingredientIds
     * param column1 string of the column name 
     * param column2 string of the column name
     * param column3 string of the column name
     * return dotProduct of ingredients and columns given
     * 
     * TODO: consider using getCell since it already divies 100 if contains %
     */

    getDotProduct: function (ingredientIDs, column1, column2, column3) {
        var dotProduct = [];
        var column1Val = 1;
        var column2Val = 1;
        var column3Val = 1;

        $.each(ingredientIDs, function (ingredientIndex, ingredientID) {

            // if (column1 != undefined) {
            //     column1Val = feedvalGrid.getCell(ingredientID, column1);
            // }
            column1Val = feedvalGrid.grid.jqGrid('getCell', ingredientID, column1);

            if (column2 == undefined) {
                column2Val = 1;
            } else {
                column2Val = feedvalGrid.grid.jqGrid('getCell', ingredientID, column2);
            }
            if (column3 == undefined) {
                column3Val = 1;
            } else {
                column3Val = feedvalGrid.grid.jqGrid('getCell', ingredientID, column3);
            }

            if (column1 == "DM") {
                column1Val = column1Val / 100;
            }

            // if (column2 == ('Min_kgcowd') && feedvalGrid.getCell('header2', 'Min_kgcowd').includes('kg')) {
            //     column2Val = column2Val / 2.20462;
            //     console.log("dotProductContains !")
            // }

            dotProduct[ingredientIndex] = column1Val * column2Val * column3Val;

            // console.log('dotProduct[ingredientIndex]: ' + dotProduct[ingredientIndex]);
        });

        var sum = dotProduct.reduce(add, 0);

        function add(a, b) {
            return a + b;
        }

        // console.log(column1 + " + " + column2 + " + " + column3 + " = " + sum); // 6

        return sum;
    },

    /*
     * Returns a matrix containing all the nutrients value in decimal of the given ingredientIDs
     * Alerts if any nutients is empty or has 0.
     * 
     * param ingredientIDs array containing ingredientIds
     * return matrix from array
     * 
     */
    getNutrientCoefficientMatrix: function (ingredientIDs) {
        var nutrientsArray = [];
        var nutrient_value;
        var blank_counter = 0;
        $.each(ingredientIDs, function (ingredientIndex, ingredientID) {
            nutrientsArray[ingredientIndex] = [];
            // console.log('ingredientID: ' + ingredientID + 'ingredientIndex: ' + ingredientIndex);
            $.each(feedvalGrid.getSelectedNutrients(), function (nutrientIndex, nutrientName) {
                //alert('ingredientID: ' + ingredientID + ', ingredientIndex: ' + ingredientIndex + ', nutrientIndex: ' + nutrientIndex + ', nutrientName: ' + nutrientName +  ', value: ' + feedvalGrid.getCell(ingredientID, nutrientName) );
                // console.log('ingredientID: ' + ingredientID + ', ingredientIndex: ' + ingredientIndex + ', nutrientIndex: ' + nutrientIndex + ', nutrientName: ' + nutrientName + ', value: ' + feedvalGrid.getCell(ingredientID, nutrientName));
                nutrient_value = feedvalGrid.getCell(ingredientID, nutrientName);
                if ((nutrient_value == '') || isNaN(nutrient_value)) {
                    nutrientsArray[ingredientIndex][nutrientIndex] = 0;
                    blank_counter++;
                } else {
                    nutrientsArray[ingredientIndex][nutrientIndex] = nutrient_value;
                }
            });
        });

        if (blank_counter > 0)
            alert('There are blank values in some of your nutrient values. They are taking a zero for Analysis purposes');

        // console.dir(nutrientsArray);
        return Matrix.create(nutrientsArray);
    },

    /*
     * Returns value of DM value in decimal value
     * 
     * param ingredientIDs array containing ingredientIds
     * return int DM
     * 
     */
    getDryMatterValue: function (ingredientID) {
        return feedvalGrid.getCell(ingredientID, 'DM');
    },

        /*
         * Returns sum of Dry Matter Values of selected Ingredients.
         * 
         * return int total DM
         * 
         * TODO: use dotProduct method. REUSE CODE
         * remove LB
         */
    getTotalDryMatterValue: function () {
        selectedIngredientIDs = feedvalGrid.getSelectedIngredientIDs();
        var dryMatterValue, calculatedProvided;
        var totalDM = 0;
        var calculatedDryMatterValue = [];
        $.each(selectedIngredientIDs, function (index, ingredientID) {


            // accounts for unit given
            var label = feedvalGrid.getCell('header2', 'Min_kgcowd');
            if (label.includes('lb')) {
                dryMatterValue = Number(feedvalGrid.getDryMatterValue(ingredientID)) * 2.20462;
            } else {
                dryMatterValue = Number(feedvalGrid.getDryMatterValue(ingredientID))
            }

            if (toolState == 'evaluator') {
                calculatedProvided = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, "Min_kgcowd"));
            } else {
                calculatedProvided = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, "Predicted_Value"));
            }
            calculatedDryMatterValue.push((dryMatterValue * calculatedProvided).toFixed(3));

            // console.log("getTotalDryMatterValue: ");
            // console.log(dryMatterValue);
            // console.log(calculatedProvided)
        });

        $.each(calculatedDryMatterValue, function (i, val) {
            totalDM = Number(val) + totalDM;

        });
        console.log(totalDM)
        return totalDM;
    },

    /*
     * Computes for the daily price for per cow. 
     * 
     * return int sum of daily price per cow. 
     * 
     * TODO: remove unit part, after fixing ConvertUnit method.
     * 
     */

    getDollarPerCowDaily: function () {
        selectedIngredientIDs = feedvalGrid.getSelectedIngredientIDs();
        var dryMatterValue, calculatedProvided, priceUnit;
        var total = 0;
        var totalValueCalculation = [];
        conversionFactor = 0;

        $.each(selectedIngredientIDs, function (index, ingredientID) {
            unit = feedvalGrid.getUnit(ingredientID);

            dryMatterValue = Number(column1Val = feedvalGrid.grid.jqGrid('getCell', ingredientID, "DM")) / 100;

            if (toolState == 'evaluator') {
                calculatedProvided = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, "Min_kgcowd"));
            } else {
                calculatedProvided = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, "Predicted_Value"));
            }
            priceUnit = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, "Price_Unit"));

            switch (unit) {
                case "ton":
                    conversionFactor = 2000;
                    break;
                case "bu":
                    conversionFactor = 56;
                    break;
                case "cwt":
                    conversionFactor = 100;
                    break;
                case "kg":
                    conversionFactor = 2.20462;
                    break;
                case "lb":
                    conversionFactor = 1;
                    break;
                default:
                    conversionFactor = 2000;
                    console.log("Error! Please contact developer!")
                    alert("Error! Please contact developer!")
            }

            totalValueCalculation.push(dryMatterValue * calculatedProvided * (priceUnit / conversionFactor));

            // console.log("------- getDollarPerCowDaily ----------");
            // console.log("dryMatterValue" + dryMatterValue);
            // console.log("calculatedProvided" + calculatedProvided);
            // console.log("priceUnit" + priceUnit);
            // console.log("conversionFactor" + conversionFactor);
            // console.log("totalValueCalculation" + (dryMatterValue * calculatedProvided * (priceUnit / conversionFactor)));


        });

        $.each(totalValueCalculation, function (i, val) {
            total = val + total;
        });

        console.log('getDollarPerCowDaily: ' + total);

        return total.toFixed(3);
    },

        /*
         * Computes for LB per DM
         * 
         * return int 
         * 
         */
    getLBperDMCalculation: function () {

        var totalDM = feedvalGrid.getTotalDryMatterValue();

        console.log(" getLBperDMCalculation() TOTAL DM: ", totalDM)

        var dollarCowD = feedvalGrid.getDollarPerCowDaily();

        return (dollarCowD / totalDM).toFixed(3);
    },

    //
    //TODO: Remove since dotProduct method does the same thing
    getColumnSum: function (columnName) {
        var total = 0;
        var totalValueCalculation = [];
        var columnVal;

        selectedIngredientIDs = feedvalGrid.getSelectedIngredientIDs();


        $.each(selectedIngredientIDs, function (index, ingredientID) {

            columnVal = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, columnName));

            totalValueCalculation.push(columnVal)

        });

        $.each(totalValueCalculation, function (i, val) {
            total = val + total;
        });
        console.log(total);

        return total.toFixed(3);
    },


        /*
         * Returns matrix contantaing  (feedPrice / dryMatterValue) for selected ingredients
         * 
         * param feedPrices is values from getFeedPrices
         * param selectedIngredientIds
         * return matrix 
         * 
         */
    getFeedPriceMatrix: function (feedPrices, selectedIngredientIDs) {
        console.log("getFeedPriceMatrix method is called");

        var dryMatterValue, fp = [];
        var feedPrice;
        $.each(selectedIngredientIDs, function (index, ingredientID) {
            feedPrice = feedPrices[ingredientID];
            if (feedPrice !== undefined) {
                dryMatterValue = feedvalGrid.getDryMatterValue(ingredientID);
                fp.push([feedPrice / dryMatterValue]);
            }

        });

        return Matrix.create(fp);
    },


    /**
     * Displays the horizontal solution row
     * 
     * TODO: work on proper warning signs.where is warning generating from ?
     * 
     * @param {*} Horizontal_solution 
     */
    displayCalculationsToSolutionRow: function (Horizontal_solution) {
        var selectedNutrients = feedvalGrid.getSelectedNutrients();

        var formattedPrices = {},
            unit; //flattened, unit;
        var violations = {};
        var warning = false;

        $.each(Horizontal_solution, function (index, price) {

            // compute for nutrients only
            if (index < (selectedNutrients.length)) {
                // console.log("selectedNutrients[" + index + "]: " + selectedNutrients[index]);
                if (selectedNutrients[index] == 'NEl3x_Mcalkg') {
                    if (feedvalGrid.getCell('header2', 'Min_kgcowd').includes('kg')) {
                        unit = '\n' + 'Mcal/kg';
                    } else {
                        unit = '\n' + 'Mcal/lb';
                    }

                } else {
                    unit = '\n' + '%DM';
                }
                // need to check within min and max values
                var min = feedvalGrid.getCell(41, selectedNutrients[index]);
                var max = feedvalGrid.getCell(42, selectedNutrients[index]);
                var tp = price;

                if ( /*selectedNutrients[index] != 'Phos' &&*/ selectedNutrients[index] != 'Starch' &&
                    selectedNutrients[index] != 'NEl3x_Mcalkg') {
                    tp = tp / 100;
                }
                tp = tp.toFixed(3);
                min = parseFloat(min).toFixed(3);
                max = parseFloat(max).toFixed(3);
                if (tp < min || tp > max) {
                    warning = true;
                    violations[selectedNutrients[index]] = true;

                    formattedPrices[selectedNutrients[index]] = "<span style='color:red'>" + price.toFixed(3) + unit + "</span>";
                } else {
                    formattedPrices[selectedNutrients[index]] = price.toFixed(3) + unit;
                }
            }

        });

        //TODO: work on proper warning signs. where is warning generating from?
        // if (warning) {
        //     //alert("No feasible solution. Pick more ingredients or relax constraints.");
        //     feedvalGrid.invalidSelectionModal.find('li').hide();
        //     feedvalGrid.showSolutionNotConvergedMessage();
        //     feedvalGrid.invalidSelectionModal.modal('show');
        //     //feedvalGrid.showOnlyRupRdpSelectedMessage();
        // }


        //Extra In for horizontal solution
        formattedPrices['Ingredient'] = 'Solution: '; //Solution Word

        var asfedLabel;
        var dmLabel;
        var predLabel;
        if (feedvalGrid.getCell('header2', 'Min_kgcowd').includes('kg')) {
            asfedLabel = ' kg as fed';
            dmLabel = ' kg DM';
            predLabel = ' <br />$/kg DM';
        } else {
            asfedLabel = ' lb as fed';
            dmLabel = ' lb DM';
            predLabel = ' <br />$/lb DM';
        }

        allIngredients = feedvalGrid.getAllIngredientIDs();
        selectedIngredients = feedvalGrid.getSelectedIngredientIDs();

        var forageIngredientID = [];
        var ingredientsIDs = [];

        $.each(allIngredients, function (index, ingredientID) {
            var ind = $('tr#' + ingredientID).find('td').html();
            if (ingredientID < 41) {
                ingredientsIDs.push(ingredientID);
            }
        });

        $.each(selectedIngredients, function (index, ingredientID) {
            var ind = $('tr#' + ingredientID).find('td').html();
            if (ind < 7 && ind > 0) {
                forageIngredientID.push(ingredientID);
            }
        });

        console.log('forageIngredientID');
        console.dir(forageIngredientID);

        // forage values intialization
        var dmTotal = feedvalGrid.getDotProduct(selectedIngredients, "DM", "Min_kgcowd");
        var dmFromForage = feedvalGrid.getDotProduct(forageIngredientID, "DM", "Min_kgcowd") / dmTotal;
        var ndfFromForage = feedvalGrid.getDotProduct(forageIngredientID, "DM", "Min_kgcowd", "NDF") / dmTotal;
        var dolarPerLbDm = (feedvalGrid.getDollarPerCowDaily() / dmTotal).toFixed(3) + '$/lb DM';

        var amountProvided = feedvalGrid.getColumnSum('Min_kgcowd');
        formattedPrices['DM'] = dmTotal.toFixed(3) + dmLabel;
        formattedPrices['Price_Unit'] = feedvalGrid.getDollarPerCowDaily() + ' $/cow.d';
        formattedPrices['Unit'] = (dmTotal / amountProvided).toFixed(3) * 100 + ' %DM';
        formattedPrices['Min_kgcowd'] = parseFloat(amountProvided).toFixed(3) + asfedLabel;


        console.log('formattedPrices');
        console.dir(formattedPrices);

        feedvalGrid.grid.jqGrid('setRowData', 'data3', formattedPrices); //FIXME: Change this data according to minimization template

        dmFromForage = (dmFromForage * 100).toFixed(3) + ' %DM forage';
        ndfFromForage = (ndfFromForage).toFixed(3) + ' %DM NDF from forage';
        feedvalGrid.setCell('data4', 'DM', dmFromForage);
        feedvalGrid.setCell('data5', 'DM', ndfFromForage);
        feedvalGrid.setCell('data4', 'Price_Unit', dolarPerLbDm);

        feedvalGrid.grid.jqGrid('setCell', 'header3', 'Min_kgcowd', feedvalGrid.getCell('header2', 'Min_kgcowd'));


    },

    /**
     * Displays selection Error Message
     * 
     * TODO: Might need work
     */
    displaySelectionErrorMessage: function () {
        var rupRdpCpSelected, nutrientsToBeRemoved, onlyRupRdpSelected, numberIngredientBiggerNumberNutrients;
        feedvalGrid.invalidSelectionModal.find('li').hide();

        rupRdpCpSelected = this.cpSelectedWithRupOrRdp();
        if (rupRdpCpSelected) {
            feedvalGrid.showRupRdpCpSelectedMessage();
        }

        onlyRupRdpSelected = this.onlyRupRdpSelected();
        //FIXME:Eventually check if this catch is correct or not
        /*
        if (onlyRupRdpSelected) {
            feedvalGrid.showOnlyRupRdpSelectedMessage(); 
        }
	*/

        nutrientsToBeRemoved = feedvalGrid.getSelectedNutrientsNotPresentInAnySelectedFeed();
        if (nutrientsToBeRemoved.length) {
            feedvalGrid.showNutrientsToBeRemovedMessage(nutrientsToBeRemoved);
        }

        // numberIngredientBiggerNumberNutrient = feedvalGrid.getNumberIngredientsBiggerThanNumberNutrients();
        // if (numberIngredientBiggerNumberNutrient < 0) {
        //     feedvalGrid.showNotnumberIngredientBiggerNumberNutrientMessage();
        //     //alert('The Number of Ingredients has to be bigger or equal than the selected number of nutrients');
        // }

        // if solution vector is empty
        /*if (solutionVector.length <= 0) {
            feedvalGrid.showNotOptimalSolutionMessage();
        }*/

        if (!feedvalGrid.selectionValid()) {
            feedvalGrid.invalidSelectionModal.modal('show');
        }
    },

    /**
     * Type of error Message shown in div
     */
    showNotOptimalSolutionMessage: function () {
        feedvalGrid.invalidSelectionModal.find('#SolNotOptimal').show();
    },

        /**
         * Type of error Message shown in div
         */
    showSolutionNotConvergedMessage: function () {
        feedvalGrid.invalidSelectionModal.find('#SolNoConverge').show();
    },

        /**
         * Type of error Message shown in div
         */
    showOnlyRupRdpSelectedMessage: function () {
        feedvalGrid.invalidSelectionModal.find('#rup_rdp').show();
    },

        /**
         * Type of error Message shown in div
         */
    showRupRdpCpSelectedMessage: function () {

        feedvalGrid.invalidSelectionModal.find('#rup_rdp_cp').show();
    },

        /**
         * Type of error Message shown in div containing name of nutrients to be removed
         */
    showNutrientsToBeRemovedMessage: function (nutrientsToBeRemoved) {
        feedvalGrid.invalidSelectionModal.find('#nut_all_zeroes').show().find('span').text(nutrientsToBeRemoved.join(', '));
    },

    /**
     * Type of error Message shown in div containing number of nutrients to be removed
     */
    showNotnumberIngredientBiggerNumberNutrientMessage: function () {
        feedvalGrid.invalidSelectionModal.find('#NumIngBigNumNut').show();
    },

/**
 *  Empties the cell for given column name of the Grid
 * @param {*} columnsToClear string
 */    
    clearColumns: function (columnsToClear) {
        var ingredients;
        ingredients = feedvalGrid.getAllIngredientIDs();
        $.each(columnsToClear, function (columnIndex, columnName) {
            $.each(ingredients, function (ingredientIndex, ingredientID) {
                feedvalGrid.grid.jqGrid('setCell', ingredientID, columnName, null, {
                    "background-color": 'transparent'
                });
            });
        });
    },

    /**
     * Empties the cell of the result column of the Grid
     */
    clearResults: function () {
        var summaryRow, resultColumns;

        resultColumns = ['Actual_Price', 'Predicted_Value'];
        feedvalGrid.clearColumns(resultColumns);

        //summaryRow = feedvalGrid.grid.jqGrid('footerData', 'get');
        /*        summaryRow = feedvalGrid.grid.jqGrid('getRowData', 'data3');
        	console.log(summaryRow);
                $.each(summaryRow, function (columnName) {
                    summaryRow[columnName] = null;
                });
                //feedvalGrid.grid.jqGrid('footerData', 'set', summaryRow, false);
                feedvalGrid.grid.jqGrid('setRowData', 'data3',summaryRow);
        */
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Ingredient', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'NEl3x_Mcalkg', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'CP', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Ca', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'NDF', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'RUP', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'RDP', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Lipid', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'peNDF', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Phos', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Starch', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'DM', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Min_kgcowd', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Unit', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Price_Unit', null);
        feedvalGrid.grid.jqGrid('setCell', 'data3', 'Predicted_Value', null);
        feedvalGrid.grid.jqGrid('setCell', 'data4', 'DM', null);
        feedvalGrid.grid.jqGrid('setCell', 'data5', 'DM', null);

        $('#r_square, #adjusted_r_square').text('');
    },

    getAllIngredientIDs: function () {
        return feedvalGrid.grid.jqGrid('getDataIDs');
    },


    getPredictedFeedPriceMatrix: function (nutrientCoefficientMatrix, predictedNutrientPriceMatrix) {
        return nutrientCoefficientMatrix.x(predictedNutrientPriceMatrix);
    },


    calculateEvaluator: function () {
        // TODO: Get formulars from excel and finish
        // console.log("Calcutationg manually");

        var selectedNutrients, nutrientCoefficientMatrix, selectedIngredientIDs, dmDotAmountProvided,
            dmPercentage;
        var Horizontal_solution = [];
        var percent_eff, dmMax;

        var computedNutrientVal = 0;

        // selection variables
        selectedIngredientIDs = feedvalGrid.getSelectedIngredientIDs();
        selectedNutrients = feedvalGrid.getSelectedNutrients();


        //computed variables
        dmPercentage = feedvalGrid.getTotalDryMatterValue();
        dmDotAmountProvided = feedvalGrid.getDmDotAmountProvided(selectedIngredientIDs);

        // console.log("dmPercentage: " + dmPercentage);
        // console.log("dmDotAmountProvided: " + dmDotAmountProvided);

        // gets selected nutritians in a matrix
        nutrientCoefficientMatrix = feedvalGrid.getNutrientCoefficientMatrix(selectedIngredientIDs);

        // console.log("nutrientCoefficientMatrix");
        // console.log(nutrientCoefficientMatrix);

        //Filling Horizontal_Solution with Nutrituinal Values

        $.each(selectedNutrients, function (nutriIndex, nutri) {
            Horizontal_solution[nutriIndex] = [];
            $.each(selectedIngredientIDs, function (idIndex, id) {
                //   console.log("nutri: " + nutri + "id: " + id + "computedNutrientVal: " + computedNutrientVal);
                //   console.log("nutrientCoefficientMatrix[idIndex][nutriIndex]: " +
                nutrientCoefficientMatrix.elements[idIndex][nutriIndex] + "dmDotAmountProvided[idIndex]" + dmDotAmountProvided[idIndex];

                computedNutrientVal = computedNutrientVal + (nutrientCoefficientMatrix.elements[idIndex][nutriIndex] *
                    dmDotAmountProvided[idIndex]);
            });

            if (dmPercentage > 0) {
                if (nutri == 'NEl3x_Mcalkg' || (nutri == 'Starch')) {
                    if (feedvalGrid.getCell('header2', 'NEl3x_Mcalkg').includes('kg')) {
                        percent_eff = 100;
                    } else {
                        percent_eff = 100 * 2.20462;
                    }
                } else {
                    percent_eff = 1;
                }
                Horizontal_solution[nutriIndex] = (computedNutrientVal / (percent_eff * dmPercentage));

            } else {
                Horizontal_solution[nutriIndex] = 0;
            }
            // console.log("nutri: " + nutri + " value: " + Horizontal_solution[nutriIndex]);

            //resets counter
            computedNutrientVal = 0;
        });

        //Fixing NEL3x unit


        // Filling Horizontal_Solution with DM amount and other calculations
        Horizontal_solution[Horizontal_solution.length] = dmPercentage; // dm to last position



        //Print Horizontal_solution
        console.log("Horizontal_solution");
        console.log(Horizontal_solution);


        // displays the nutrient solution array and calcuations
        feedvalGrid.displayCalculationsToSolutionRow(Horizontal_solution);
    },

    analyze: function () {
        var predictedNutrientPriceMatrix, nutrientCoefficientMatrix, selectedIngredientIDs,
            predictedFeedPriceMatrix, allIngredientIDs, percentageDifferenceMatrix,
            selectedNutrients, rSquare, adjustedRSquare, actualFeedPriceMatrix, nonSelectedIngredientIDs, predictedNutrientPriceMatrixNonSelected, percentageDifferenceMatrixNonSelected,
            percentageDifferenceMatrixNonSelected, actualFeedPriceMatrixNonSelected, solutionVector, solutionArray;


        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        selectedIngredientIDs = feedvalGrid.getSelectedIngredientIDs();

        nonSelectedIngredientIDs = feedvalGrid.getNonSelectedIngredientIDs(); //NEW
        selectedNutrients = feedvalGrid.getSelectedNutrients();


        feedvalGrid.getFeedPrices(selectedIngredientIDs).done(function (actualFeedPrices) {


            actualFeedPriceMatrix = feedvalGrid.getFeedPriceMatrix(actualFeedPrices, selectedIngredientIDs);
            // console.log('-------------------FeedPriceMatrix-------------------');
            // console.log(actualFeedPriceMatrix);

            //FIXME:Check Improve calculateMinimization
            var columnsToAppear, data, ingredientID, unit, rawData;
            columnsToAppear = JSON.stringify(feedvalGrid.getWhitelistedColumns());
            rawData = feedvalGrid.grid.jqGrid('getRowData');
            //console.log('RAW DATA');
            //console.log('-------------');
            //console.log(rawData);
            //console.log('-------------');



            var valMax = 0;
            $.each(rawData, function (rowIndex, row) {
                //            console.dir('kkk');
                //            console.dir(row.Ingredient);
                ingredientID = row.ID;
                unit = feedvalGrid.getUnit(ingredientID);
                row.Unit = unit;
                if (row.Price_Unit == "") {
                    row.Selected = "NO";
                }
                if (row.Ingredient == 'Max') {
                    //                console.dir("aaaa");
                    //                console.dir(row);
                    console.log('row.DM');
                    console.log(row.DM);
                    valMax = row.DM;
                }
            });

            // going through and if max is 0, set as unchecked in rawData
            var inLB;
            // if (feedvalGrid.getCell('header2', 'Min_kgcowd').includes('lb')) {
            //     inLB = true;
            // }
            $.each(rawData, function (rowIndex, row) {
                if (row.Max_kgcowd == 0 || row.Max_kgcowd == '0') {
                    row.Selected = "NO";
                }
                // if (inLB) {
                //     row.NEl3x_Mcalkg = row.NEl3x_Mcalkg / 2.20462;

                //     if (rowIndex == 43 || rowIndex == 44) {
                //         row.DM = '23';
                //     }
                //     if (rowIndex < 40) {
                //         row.Max_kgcowd = row.Max_kgcowd / 2.20462;
                //     }
                // }
            });

            data = JSON.stringify(rawData);
            // console.log(rawData);
            //console.log("data"); console.log(data);
            //console.log("Columns to appear"); console.log(columnsToAppear);
            // console.log(data);
            solutionArray = calculateMinimization(data, columnsToAppear);

            console.log("Solution Array: ");
            console.log(solutionArray);

            solutionVector = solutionArray['0'];

            // console.log("Solution vector: ");
            // console.log(solutionVector);

            var label = feedvalGrid.getCell('header2', 'Min_kgcowd');
            // if (label.includes('lb')) {
            //     feedvalGrid.convertSolutionToLB(solutionVector);
            // }
            // check to make sure maxKg=0 ingredients not used ie all ingredients were used cause no solution
            var noSol = false;
            for (var i = 0; i < solutionVector.length; i++) {
                var rowID = i + 1;
                if (rowID > 40) break;
                var maxVal = feedvalGrid.getCell(rowID, 'Max_kgcowd');
                //console.log("Max Value of ingredient: " + rowID + " = " + maxVal);
                if ((maxVal == 0 || maxVal == '0') && solutionVector[i] > 0) {
                    noSol = true;
                    break;
                }
            }
            if (noSol) {
                feedvalGrid.invalidSelectionModal.find('li').hide();
                feedvalGrid.showNotOptimalSolutionMessage();
                feedvalGrid.invalidSelectionModal.modal('show');
                feedvalGrid.clearResults();
                return;
            }

            predictedNutrientPriceMatrix = calculatePredictedNutrientPrices();
            //console.log(predictedNutrientPriceMatrix)    
            if (needToRemoveNutrientsWithNegativePredictedPrices()) {
                //console.log("removing with negative prices");
                removeNutrientsWithNegativePredictedPrices();
                feedvalGrid.analyze();
                return;
            }



            nutrientCoefficientMatrix = feedvalGrid.getNutrientCoefficientMatrix(allIngredientIDs);

            predictedFeedPriceMatrix = feedvalGrid.getPredictedFeedPriceMatrix(nutrientCoefficientMatrix, predictedNutrientPriceMatrix);
            percentageDifferenceMatrix = getPercentageDifferenceMatrix();


            rSquare = calculateRSquare();
            adjustedRSquare = calculateAdjustedRSquare();

            //            predictedNutrientPriceMatrix.push('27.11');
            //console.dir('xxxx');
            //console.dir(data);
            //console.dir(rawData);



            //displayPredictedFeedPrices(predictedFeedPriceMatrix.elements); //FIXME:Change this for solution vector
            solutionStore = solutionVector;
            displaySolutionVector(solutionVector);


            // displayEqResult(solutionArray['2']);
            displayEqResult(feedvalGrid.getDollarPerCowDaily());

            //displayPredictedNonSelected(predictedFeedPriceMatrix.elements);
            //feedvalGrid.saveGrid();
            displayPredictedNutrientPrices(predictedNutrientPriceMatrix, valMax);
            // FIXME: updating values for Evaluator
            // feedvalGrid_calc.getAsFedFromOptimizer();

        });


        function calculateMinimization(data, columnsToAppear) {
            var solutionArray;

            minimize = 1;
            //console.log(data);
            // console.log(columnsToAppear);
            //     console.log("data in minimization");
            //     console.log("--------------------");
            //     console.log(data);
            //     console.log("--------------------");


            $.ajax({
                data: {
                    columnsToAppear: columnsToAppear,
                    data: data,
                    minimize: minimize
                },
                type: 'POST',
                dataType: 'json',
                async: false,
                cache: false,
                success: function (data) {
                    //FIXME: Implement displaying of the results
                    solutionArray = data;
                    //window.location.href = data.spreadsheetFilename;
                },
                error: function(data){
                    console.log(data.responseText);
                }
            });
            //console.log("solution array in minimization");
            //console.log("------------------------------");
            //console.log(solutionArray);
            //console.log("------------------------------");
            return solutionArray;
        }




        //function calculatePredictedNutrientPrices() {
        //    var X, Y;
        //    X = feedvalGrid.getNutrientCoefficientMatrix(selectedIngredientIDs);
        //    Y = actualFeedPriceMatrix;
        //    return (X.transpose().x(X)).inverse().x(X.transpose()).x(Y);
        //}

        function calculatePredictedNutrientPrices() {
            var X; //Y;
            //console.log("Selected ingredients: " + selectedIngredientIDs)
            selectedIngredientIDs = selectedIngredientIDs.sort(function (a, b) {
                return a - b
            })
            //console.log("Selected ingredients: " + selectedIngredientIDs)
            //	      console.log("Solution Vector: " + solutionVector)

            X = feedvalGrid.getNutrientCoefficientMatrix(selectedIngredientIDs);
            //Y = actualFeedPriceMatrix;
            NutrientMatrix = JSON.stringify(X.transpose());
            var selectedNutrients = feedvalGrid.getSelectedNutrients();
            var kg_DM = 0;
            $.each(selectedIngredientIDs, function (index, ingredientID) {
                var ind = $('tr#' + ingredientID).find('td').html();
                var f1 = feedvalGrid.getCell(ingredientID, 'DM');
                var f2 = solutionVector[ind - 1];
                var p = f1 * f2;
                if (!isNaN(p)) {
                    //                        kg_DM = kg_DM + feedvalGrid.getCell(ingredientID,'DM')*solutionVector[ingredientID-1];
                    kg_DM = kg_DM + p;
                }
                //console.log("Index: " + ind + " ID: " + ingredientID + " Name: " + feedvalGrid.getCell(ingredientID,'Ingredient') + " DM: " + feedvalGrid.getCell(ingredientID,'DM') + " Sol: " + solutionVector[ind-1] + " Result: " + 
                //feedvalGrid.getCell(ingredientID,'DM')*solutionVector[ind-1])
            });
            //	      console.log(" kg_DM: " + kg_DM);
            //              console.dir(selectedNutrients);

            //console.log("Nutrient Matrix" + X.transpose().elements[0]) 
            var percent_eff;
            var solutionNutrients = [];
            var solutionNutrient = 0;
            //              console.log("Solution Vector: " + solutionVector);
            $.each(selectedNutrients, function (nutrient_index, nutrient) {
                //                  console.dir('acaaa');
                if ((nutrient == 'NEl3x_Mcalkg') || (nutrient == 'Starch')) {
                    percent_eff = 100 * kg_DM;
                } else {
                    percent_eff = kg_DM;
                }
                solutionNutrient = 0;
                $.each(selectedIngredientIDs, function (index, ingredientID) {
                    //                    console.dir('a: ' + X.transpose().elements[nutrient_index][index]);
                    //                    console.dir('b: ' + feedvalGrid.getCell(ingredientID,'DM'));
                    var ing = ingredientID - 1;
                    var ind = $('tr#' + ingredientID).find('td').html();
                    //                    console.dir('id: '+ing);
                    //                    console.dir('c: ' + solutionVector[ingredientID-1]);
                    //                    if( dat_ing !== null && typeof(dat_ing) !== "undefined" ){
                    //var c = solutionVector[ingredientID-1];
                    var c = solutionVector[ind - 1];
                    if (c !== null && typeof (c) !== "undefined") {
                        solutionNutrient = solutionNutrient + X.transpose().elements[nutrient_index][index] * feedvalGrid.getCell(ingredientID, 'DM') * c * 100;
                    }
                });
                //                console.dir('nut:: '+solutionNutrient);
                solutionNutrient = solutionNutrient / percent_eff;
                solutionNutrients.push(solutionNutrient);

                //FIXME: Check to see if solution nutrient is between corresponding min and max values

            });

            return solutionNutrients;
        }

        function calculateSumSol() {
            var sumSolVector = 0;
            $.each(solutionVector, function (index, element) {
                sumSolVector = sumSolVector + element;
            });

            //console.log("Sel Ingredients from SumSol: " + selectedIngredientIDs)
            //console.log("Sol Vector from SumSol: " + solutionVector)		
            //console.log("Length of Sol Vector: " + solutionVector.length)

            return sumSolVector;

        }



        function displayRSquares() {
            $('#r_square').text(rSquare.toFixed(3));
            $('#adjusted_r_square').text(adjustedRSquare.toFixed(3));
        }

        function displayEqResult(eqResult) {
            $('#eq_result').text(eqResult + ' $/cow.d');
        }

        function calculateAdjustedRSquare() {
            var numSelectedIngredients, numSelectedNutrients;
            numSelectedIngredients = selectedIngredientIDs.length;
            numSelectedNutrients = selectedNutrients.length;
            return 1 - ((numSelectedIngredients - 1) / (numSelectedIngredients - numSelectedNutrients)) * (1 - rSquare);
        }

        function calculateRSquare() {
            var averageActualFeedPrice, flattenedActualFeedPrices, numerator, denominator, flattenedPredictedFeedPrices, predictedFeedPriceMatrix;
            flattenedActualFeedPrices = getFlattenedArray(actualFeedPriceMatrix.elements);
            predictedFeedPriceMatrix = getPredictedFeedPriceForSelectedIngredients();
            flattenedPredictedFeedPrices = getFlattenedArray(predictedFeedPriceMatrix.elements);

            averageActualFeedPrice = flattenedActualFeedPrices.reduce(function (previous, current) {
                return previous + current;
            }) / flattenedActualFeedPrices.length;
            numerator = sumOfSquaresOfDifferences(flattenedPredictedFeedPrices);
            denominator = sumOfSquaresOfDifferences(flattenedActualFeedPrices);

            return numerator / denominator;

            function sumOfSquaresOfDifferences(array) {
                return array.map(function (a) {
                    return Math.pow(a - averageActualFeedPrice, 2);
                }).reduce(function (previous, current) {
                    return previous + current;
                });
            }
        }

        function getPredictedFeedPriceForSelectedIngredients() {
            var nutrientCoefficientMatrix = feedvalGrid.getNutrientCoefficientMatrix(selectedIngredientIDs);
            return feedvalGrid.getPredictedFeedPriceMatrix(nutrientCoefficientMatrix, predictedNutrientPriceMatrix);
        }


        function getPercentageDifferenceMatrix() {
            var predictedFeedPriceMatrix = getPredictedFeedPriceForSelectedIngredients();
            return actualFeedPriceMatrix.map(function (actualPrice, i, j) {
                return actualPrice / predictedFeedPriceMatrix.e(i, j) * 100;
            });
        }


        function displayPercentageDifferences(percentageDifferences) {
            var flattened = getFlattenedArray(percentageDifferences);
            $.each(selectedIngredientIDs, function (index, ingredientID) {
                var percentageDifference = flattened[index].toFixed(0);
                var color = getBackgroundColor(percentageDifference);
                feedvalGrid.setCell(ingredientID, 'Actual_Price', percentageDifference, {
                    "background-color": color
                });
            });

            function getBackgroundColor(price) {
                var indicators = {
                    good: '#00DB12',
                    bad: '#F93636',
                    neutral: 'transparent'
                };
                if (price < 100) {
                    return indicators.good;
                } else if (price == 100) {
                    return indicators.neutral;
                } else {
                    return indicators.bad;
                }
            }
        }


        function displayPredictedFeedPrices(predictedFeedPrices) {

            var DM, predictedFeedPrice, flattened, ingredients = [];
            flattened = getFlattenedArray(predictedFeedPrices);
            $.each(allIngredientIDs, function (index, ingredientID) {
                ingredients[index] = {
                    ingredientName: feedvalGrid.getCell(ingredientID, 'Ingredient'),
                    ingredientID: ingredientID,
                    price: flattened[index],
                    fromUnit: 'Lb',
                    toUnit: feedvalGrid.getUnit(ingredientID)
                };
            });
            feedvalGrid.convertUnits(ingredients).done(function (converted) {
                $.each(allIngredientIDs, function (index, ingredientID) {
                    DM = feedvalGrid.getCell(ingredientID, 'DM');
                    predictedFeedPrice = converted[ingredientID] * DM;
                    feedvalGrid.setCell(ingredientID, 'Predicted_Value', predictedFeedPrice.toFixed(3) + '/' + ingredients[index].toUnit);
                });
            });
        }


        //FIXME:Change this function to accomodate Solution Vector
        function displaySolutionVector(solutionVector) {

            var DM, predictedFeedPrice, flattened, ingredients = [];
            //flattened = getFlattenedArray(predictedFeedPrices);

            $.each(allIngredientIDs, function (index, ingredientID) {
                ingredients[index] = {
                    ingredientName: feedvalGrid.getCell(ingredientID, 'Ingredient'),
                    ingredientID: ingredientID,
                    price: solutionVector[index],
                    fromUnit: 'Lb', //FIXME: Adjunts unit
                    toUnit: feedvalGrid.getUnit(ingredientID)
                };
            });

            //feedvalGrid.convertUnits(ingredients).done(function (converted) {
            var warning = false;
            $.each(allIngredientIDs, function (index, ingredientID) {
                var dat_ing = solutionVector[index];
                if (solutionVector[index] < 0) {
                    warning = true;
                    return;
                }

                if (dat_ing !== null && typeof (dat_ing) !== "undefined" /*&& sel==true*/ ) {
                    var color = getBackgroundColor(solutionVector[index]);
                    feedvalGrid.setCell(ingredientID, 'Predicted_Value', solutionVector[index].toFixed(3), {
                        "background-color": color
                    });
                }
            });

            function getBackgroundColor(price) {
                var indicators = {
                    good: '#99FF66',
                    bad: '#FF9696',
                    neutral: 'transparent'
                };
                if (price > 0) {
                    return indicators.good;
                } else if (price == 0) {
                    return indicators.neutral;
                } else {
                    return indicators.bad;
                }
            }



        }



        function displayPredictedNonSelected(predictedFeedPrices) {
            var DM, predictedFeedPrice, flattened, actualPrice, diffPrice, partOfNonSelected, ingredients = [];
            partOfNonSelected = 0;
            flattened = getFlattenedArray(predictedFeedPrices);
            $.each(allIngredientIDs, function (index, ingredientID) {
                ingredients[index] = {
                    ingredientName: feedvalGrid.getCell(ingredientID, 'Ingredient'),
                    ingredientID: ingredientID,
                    price: flattened[index],
                    fromUnit: 'Lb',
                    toUnit: feedvalGrid.getUnit(ingredientID)
                };
            });

            feedvalGrid.convertUnits(ingredients).done(function (converted) {
                $.each(allIngredientIDs, function (index, ingredientID) {
                    DM = feedvalGrid.getCell(ingredientID, 'DM');
                    predictedFeedPrice = converted[ingredientID] * DM;
                    actualPrice = feedvalGrid.getCell(ingredientID, 'Price_Unit');
                    $.each(nonSelectedIngredientIDs, function (indexNonSelected, ingredientIDNonSelected) {
                        if (ingredientID == ingredientIDNonSelected) {
                            partOfNonSelected = 1;
                        }
                    });


                    if ((actualPrice != '') && !(isNaN(actualPrice)) && (partOfNonSelected == 1)) {
                        diffPrice = actualPrice / predictedFeedPrice * 100;
                        diffPrice = diffPrice.toFixed(0)
                        //alert(actualPrice);
                        //alert(predictedFeedPrice);
                        //alert(diffPrice);
                        //feedvalGrid.setCell(ingredientID, 'Predicted_Value', predictedFeedPrice.toFixed(3) + '/' + ingredients[index].toUnit);
                        var color = getBackgroundColor(diffPrice);
                        feedvalGrid.setCell(ingredientID, 'Actual_Price', diffPrice, {
                            "background-color": color
                        });
                    }
                    partOfNonSelected = 0;

                });
            });

            function getBackgroundColor(price) {
                var indicators = {
                    good: '#99FF66',
                    bad: '#FF9696',
                    neutral: 'transparent'
                };
                if (price < 100) {
                    return indicators.good;
                } else if (price == 100) {
                    return indicators.neutral;
                } else {
                    return indicators.bad;
                }
            }




        }




        function displayPredictedNutrientPrices(Horizontal_solution, valMax) {

            var formattedPrices = {},
                unit; //flattened, unit;
            var violations = {};
            var warning = false;
            //console.log(Horizontal_solution); 
            //flattened = getFlattenedArray(predictedNutrientPrices);
            $.each(Horizontal_solution, function (index, price) {
                if (selectedNutrients[index] == 'NEl3x_Mcalkg')
                    if (feedvalGrid.getCell('header2', 'Min_kgcowd').includes('kg')) {
                        unit = '\n' + 'Mcal/kg';
                    } else {
                        unit = '\n' + 'Mcal/lb';
                    }
                else
                    unit = '\n' + '%DM';
                // need to check within min and max values
                var min = feedvalGrid.getCell(41, selectedNutrients[index]);
                var max = feedvalGrid.getCell(42, selectedNutrients[index]);
                var tp = price;
                if ( /*selectedNutrients[index] != 'Phos' &&*/ selectedNutrients[index] != 'Starch' && selectedNutrients[index] != 'NEl3x_Mcalkg') {
                    tp = tp / 100;
                }
                tp = tp.toFixed(3);
                min = parseFloat(min).toFixed(3);
                max = parseFloat(max).toFixed(3);
                if (tp < min || tp > max) {
                    warning = true;
                    violations[selectedNutrients[index]] = true;

                    formattedPrices[selectedNutrients[index]] = "<span style='color:red'>" + price.toFixed(3) + unit + "</span>";
                } else {
                    formattedPrices[selectedNutrients[index]] = price.toFixed(3) + unit;
                }
            });
            if (warning) {
                //alert("No feasible solution. Pick more ingredients or relax constraints.");
                feedvalGrid.invalidSelectionModal.find('li').hide();
                feedvalGrid.showSolutionNotConvergedMessage();
                feedvalGrid.invalidSelectionModal.modal('show');
                //feedvalGrid.showOnlyRupRdpSelectedMessage();
            }
            //            console.dir();
            var kgasfed = calculateSumSol();
            var unitval = valMax / kgasfed;
            //Extra In for horizontal solution
            formattedPrices['Ingredient'] = 'Solution: '; //Solution Word
            //formattedPrices['DM'] = parseFloat(Math.round(valMax * 100) / 100).toFixed(3) + ' kg DM';//Max
            //formattedPrices['Predicted_Value'] = parseFloat(Math.round(kgasfed * 100) / 100).toFixed(3) + ' kg as fed';
            var asfedLabel;
            var dmLabel;
            var predLabel;

            if (feedvalGrid.getCell('header2', 'Min_kgcowd').includes('kg')) {
                asfedLabel = ' kg as fed';
                dmLabel = ' kg DM';
                predLabel = ' <br />$/kg DM';
            } else {
                asfedLabel = ' lb as fed';
                dmLabel = ' lb DM';
                predLabel = ' <br />$/lb DM';

            }
            formattedPrices['DM'] = parseFloat(valMax).toFixed(3) + dmLabel; //Max
            formattedPrices['Min_kgcowd'] = parseFloat(Math.round(kgasfed * 100) / 100).toFixed(3) + asfedLabel;
            var prod = parseFloat(solutionArray['2']);

            var tmpcalc = 100 * parseFloat(unitval);
            formattedPrices['Unit'] = tmpcalc.toFixed(3) + ' %DM';

            formattedPrices['Predicted_Value'] = 0;
            var nvalCalc = parseFloat(solutionArray['2'] / valMax).toFixed(3);
            if (nvalCalc) {
                formattedPrices['Predicted_Value'] = nvalCalc;
                formattedPrices['Predicted_Value'] += predLabel;
            }

            // calcualte DM Forage variables
            var dm_forage = 0;
            var ndf_forage = 0;
            var all_forage = 0;
            allIngredients = feedvalGrid.getAllIngredientIDs();
            // console.log(solutionVector);
            $.each(allIngredients, function (index, ingredientID) {
                var ind = $('tr#' + ingredientID).find('td').html();
                var NDF = parseFloat(feedvalGrid.getCell(ingredientID, 'NDF'));
                var cur_dm = parseFloat(feedvalGrid.getCell(ingredientID, 'DM'));
                var max = parseFloat(feedvalGrid.getCell(ingredientID, 'Max_kgcowd'));
                if (ingredientID < 41) {
                    all_forage = all_forage + parseFloat(NDF * cur_dm * solutionVector[ind - 1]);
                }
                // console.log(all_forage + " " +ingredientID);
                if (ind < 7 && ind > 0) {
                    //console.log("ind: " +ind+ " solution value: "+solutionVector[ind-1]+ " NDF: "+NDF+" DM%: "+cur_dm);
                    dm_forage = dm_forage + parseFloat(cur_dm * solutionVector[ind - 1]); //console.log(dm_forage);
                    ndf_forage = ndf_forage + parseFloat(NDF * cur_dm * solutionVector[ind - 1]);
                    //alert(ingredientID + "   " + parseFloat(NDF*cur_dm*solutionVector[ingredientID-1]));
                }
            });

            formattedPrices['DM'] = feedvalGrid.getTotalDryMatterValue();
            formattedPrices['Price_Unit'] = feedvalGrid.getDollarPerCowDaily() + ' $/cow.d';
            var dm_total = formattedPrices['DM'];
            var forage_DM = parseFloat((dm_forage / dm_total) * 100).toFixed(3);
            var NDF_forage = parseFloat(((dm_forage * (parseFloat(formattedPrices['NDF']) / 100)) / dm_total) * 100).toFixed(3);

            // console.log('formattedPrices');
            // console.dir(formattedPrices);
            // console.log("DM forage " + dm_forage);
            // console.log("DM dm_total " + dm_total);

            //feedvalGrid.setCell(43, forage_DM);
            //feedvalGrid.setCell(44, NDF_forage);
            feedvalGrid.grid.jqGrid('setRowData', 'data3', formattedPrices); //FIXME: Change this data according to minimization template
            forage_DM = forage_DM + ' %DM forage';
            // ndf_forage = ((ndf_forage / all_forage) * 100).toFixed(3) + ' %DM NDF from forage';
            ndf_forage = ((ndf_forage / dm_total) * 100).toFixed(3) + ' %DM NDF from forage';

            feedvalGrid.setCell('data4', 'DM', forage_DM);
            feedvalGrid.setCell('data5', 'DM', ndf_forage);
            //feedvalGrid.grid.jqGrid('footerData', 'set', formattedPrices, false);
            //feedvalGrid.grid.jqGrid('setCell', 43, selectedNutrients[index], null, {"background-color": 'red'});
        }


        function removeNutrientsWithNegativePredictedPrices() {
            var nutrientsWithNegativePredictedPrices = getNutrientsWithNegativePredictedPrices();
            feedvalGrid.grid.jqGrid('hideCol', nutrientsWithNegativePredictedPrices);
            feedvalGrid.nutrientsSelectBox.multiselect('deselect', nutrientsWithNegativePredictedPrices)
        }

        function getNutrientsWithNegativePredictedPrices() {
            var flattenedArray = getFlattenedArray(predictedNutrientPriceMatrix.elements);
            return $.grep(selectedNutrients, function (nutrientName, index) {
                return flattenedArray[index] < 0;
            });
        }

        function needToRemoveNutrientsWithNegativePredictedPrices() {
            return feedvalGrid.checkbox.is(':checked') && nutrientsWithNegativePredictedPricesExist();

            function nutrientsWithNegativePredictedPricesExist() {
                return getNutrientsWithNegativePredictedPrices().length;
            }
        }

        function getFlattenedArray(column) {
            return column.reduce(function (previous, current) {
                return previous.concat(current);
            })
        }
    },

    //Color row if value is higher than 0 in evaluator state
    formatNonZeroRow: function () {
        var allIngredientIDs = feedvalGrid.getAllIngredientIDs();

        if (toolState == 'evaluator') {
            $.each(allIngredientIDs, function (i, ingredientID) {
                var id = Number(ingredientID);
                var Min_kgcowd = feedvalGrid.getCell(id, 'Min_kgcowd');
                if (Min_kgcowd > 0) { //deleted
                    console.log("Formatting: " + ingridedientID);
                    $('#grid tr[id^="' + id + '"]').addClass("nonZeroRow");
                } else {
                    $('#grid tr[id^="' + id + '"]').removeClass("nonZeroRow");
                }
            });
        } else {
            $.each(allIngredientIDs, function (i, ingredientID) {
                $('#grid tr[id^="' + ingredientID + '"]').removeClass("nonZeroRow");
            });
        }
    },

    saveGrid: function () {
        feedvalGrid.grid.jqGrid('editCell', 0, 0, false);
    },

    setCell: function (ingredientID, columnName, value, css) {
        css = css || {};
        feedvalGrid.grid.jqGrid('setCell', ingredientID, columnName, value, css);
    },

    AJAXError: function (jqXHR, textStatus, errorThrown) {
        feedvalGrid.ajaxErrorModal.find('#response_text').html(jqXHR.responseText);
        feedvalGrid.ajaxErrorModal.find('#text_status').html(textStatus);
        feedvalGrid.ajaxErrorModal.find('#error_thrown').html(errorThrown);
        feedvalGrid.ajaxErrorModal.modal('show');
    },
    afterEditCell: function (rowID, cellname, value, iRow, iCol) {
        //console.dir(rowID + ' '+cellname+' '+value+' ' +iRow + ' ' + iCol);
        if (rowID === 'header2' || rowID === 'header3' || rowID === 'separator' || rowID === 'data3' || rowID === 'data4' || rowID === 'data5') {
            var tmprow = rowID;
            gridSelector = $("#" + this.id);
            gridSelector.restoreCell(iRow, iCol);
            $('#grid tr[id^="' + tmprow + '"]').removeClass('ui-state-hover');
            $('#grid tr[id^="' + tmprow + '"]').find("td").eq(iCol).removeAttr('class');
        }
    },
    onSelectRow: function (ingredientID, status) {
        var selected;
        feedvalGrid.clearResults();
        if (status) {
            selected = 'YES';
        } else {
            selected = 'NO';
        }
        feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Selected', selected);
    },

    onSelectAll: function () {
        var status = $('#cb_grid').is(':checked');
        var selected;
        if (status) {
            selected = 'YES';
        } else {
            selected = 'NO';
        }
        var allIngredients = feedvalGrid.getAllIngredientIDs();
        $.each(allIngredients, function (index, ingredientID) {
            if (ingredientID <= 40) {
                feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Selected', selected);
            }
        });
        feedvalGrid.clearResults();
    },


    afterSaveCell: function () {
        feedvalGrid.clearResults();
        //feedvalGrid.formatNonZeroRow();

        var allIngredientIDs = feedvalGrid.getAllIngredientIDs();

        if (toolState == 'evaluator') {
            $.each(allIngredientIDs, function (i, ingredientID) {
                ingredientID = Number(ingredientID);
                var Min_kgcowd = feedvalGrid.getCell(ingredientID, 'Min_kgcowd');
                if (Min_kgcowd > 0) { //deleted
                    console.log("Formatting: " + ingredientID);
                    $('#grid tr[id^="' + ingredientID + '"]').addClass("nonZeroRow");
                } else {
                    $('#grid tr[id^="' + ingredientID + '"]').removeClass("nonZeroRow");
                }
            });
        } else {
            $.each(allIngredientIDs, function (i, ingredientID) {
                $('#grid tr[id^="' + ingredientID + '"]').removeClass("nonZeroRow");
            });
        }

    },

    createGrid: function (data) {
        //console.dir(data);
        var jqGridOptions;

        feedvalGrid.nutrients = data.nutrients;
        jqGridOptions = data.jqGridOptions;

        jqGridOptions.loadComplete = feedvalGrid.loadComplete;
        jqGridOptions.onSelectRow = feedvalGrid.onSelectRow;
        jqGridOptions.afterEditCell = feedvalGrid.afterEditCell;
        jqGridOptions.onSelectAll = feedvalGrid.onSelectAll;
        jqGridOptions.afterSaveCell = feedvalGrid.afterSaveCell;

        feedvalGrid.grid = $('#grid');
        feedvalGrid.grid.jqGrid(jqGridOptions);

    },

    createModals: function () {
        var modalOptions = {
            show: false
        };
        this.invalidSelectionModal = $('#invalid-selection-modal').modal(modalOptions);
        this.ajaxErrorModal = $('#ajax-error-modal').modal(modalOptions);
    },

    createNutrientSelectMenu: function () {
        this.nutrientsSelectBox = $('#nutrients');
        this.nutrientsSelectBox.empty();
        $.each(feedvalGrid.nutrients, function (xmlMap, nutrient) {
            feedvalGrid.nutrientsSelectBox.append('<option value="' + xmlMap + '">' + nutrient + '</option>')
        });
        var selectedNutrients = feedvalGrid.getSelectedNutrients();
        this.nutrientsSelectBox.multiselect({
            numberDisplayed: 0,
            onChange: function (element, checked) {
                var hideOrShow = checked ? 'showCol' : 'hideCol';
                feedvalGrid.grid.jqGrid(hideOrShow, element.val());
                feedvalGrid.clearResults();
            }
        });
        this.nutrientsSelectBox.multiselect('rebuild');
        this.nutrientsSelectBox.multiselect('select', selectedNutrients);
    },

    loadComplete: function () {
        feedvalGrid.groupHeaders();
        feedvalGrid.selectIngredientsWithPrices();
        feedvalGrid.createNutrientSelectMenu();

        (function () {
            var fromUnit;
            $('.input_column select').focus(function (eventObject) {
                fromUnit = $(eventObject.target).val();
                console.dir(fromUnit);
            }).change(function (eventObject) {
                var tr, ingredientID, ingredientName, price, select, toUnit;
                feedvalGrid.clearResults();
                select = $(eventObject.target);
                toUnit = select.val();
                console.dir(toUnit);
                tr = select.parents('tr').get(0);
                ingredientID = $(tr).attr('id');
                var pricePerUnitColumnIndex = feedvalGrid.getColumnIndex('Price_Unit');
                feedvalGrid.grid.jqGrid('saveCell', ingredientID, pricePerUnitColumnIndex);
                ingredientName = feedvalGrid.getCell(ingredientID, 'Ingredient');
                price = feedvalGrid.getCell(ingredientID, 'Price_Unit');

                if (price != '') {
                    feedvalGrid.convertUnits({
                        ingredientName: ingredientName,
                        ingredientID: ingredientID,
                        price: price,
                        fromUnit: fromUnit,
                        toUnit: toUnit
                    }).done(function (converted) {
                        var priceInConvertedUnit = converted[ingredientID];
                        feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceInConvertedUnit.toFixed(2));
                        select.blur();
                    });
                }
            });
        })();



        //recorrer class sepp
        $('#grid tr[id^="separator"]').find("td").eq(0).html('');
        $('#grid tr[id^="separator"]').find("td").eq(1).html('');

        $('#grid tr[id^="header2"]').find("td").eq(0).html('');
        $('#grid tr[id^="header2"]').find("td").eq(1).html('');

        $('#grid tr[id^="header3"]').find("td").eq(0).html('');
        $('#grid tr[id^="header3"]').find("td").eq(1).html('');

        $('#grid tr[id^="41"]').find("td").eq(0).html('');
        $('#grid tr[id^="41"]').find("td").eq(1).html('');

        $('#grid tr[id^="42"]').find("td").eq(0).html('');
        $('#grid tr[id^="42"]').find("td").eq(1).html('');

        $('#grid tr[id^="data3"]').find("td").eq(0).html('');
        $('#grid tr[id^="data3"]').find("td").eq(1).html('');
        $('#grid tr[id^="data3"]').removeClass('jqgrow');
        $('#grid tr[id^="data3"]').removeClass('ui-row-ltr');
        $('#grid tr[id^="data3"]').addClass("footrow");
        $('#grid tr[id^="data3"]').addClass("footrow-ltr");

        $('#grid tr[id^="data4"]').find("td").eq(0).html('');
        $('#grid tr[id^="data4"]').find("td").eq(1).html('');
        $('#grid tr[id^="data4"]').removeClass('jqgrow');
        $('#grid tr[id^="data4"]').removeClass('ui-row-ltr');
        $('#grid tr[id^="data4"]').addClass("footrow");
        $('#grid tr[id^="data4"]').addClass("footrow-ltr");


        $('#grid tr[id^="data5"]').find("td").eq(0).html('');
        $('#grid tr[id^="data5"]').find("td").eq(1).html('');
        $('#grid tr[id^="data5"]').removeClass('jqgrow');
        $('#grid tr[id^="data5"]').removeClass('ui-row-ltr');
        $('#grid tr[id^="data5"]').addClass("footrow");
        $('#grid tr[id^="data5"]').addClass("footrow-ltr");


        var arr_h2 = [
            'Ingredient',
            'NEl3x Mcal/kg',
            'CP %',
            'NDF %',
            'RUP %',
            'RDP %',
            'Lipid %',
            'peNDF %',
            'Ca %',
            'Phos %',
            'Starch',
            'DM %',
            'Min lb/cow.d',
            'Max lb/cow.d',
            'Unit',
            'Price* $/Unit',
            'Solution lb/cow.d'
        ];
        var arr_h3 = [
            'Condition',
            'NEl3x Mcal/kg',
            'CP %',
            'NDF %',
            'RUP %',
            'RDP %',
            'Lipid %',
            'peNDF %',
            'Ca %',
            'Phos %',
            'Starch',
            'kg DM'
        ];

        $('#grid tr[id^="header2"]').find("td").each(function (index) {
            if (index > 1) {
                var ni = parseInt(1 * index - 4);
                if (arr_h2[ni]) {
                    var tmp = '' + arr_h2[ni] + '';
                    $(this).html(tmp);
                }
            }
        });
        $('#grid tr[id^="header3"]').find("td").each(function (index) {
            if (index > 1) {
                var ni = parseInt(1 * index - 4);
                if (arr_h3[ni]) {
                    var tmp = '' + arr_h3[ni] + '';
                    $(this).html(tmp);
                }
            }
        });
        $("#header2").css("height", "42px!important");
        $('#grid tr[id^="header2"]').addClass('footrow footrow-ltr');
        $('#grid tr[id^="header3"]').addClass('footrow footrow-ltr');

        feedvalGrid.grid.jqGrid('setCell', 37, 'Ingredient', 'Barley');
        feedvalGrid.grid.jqGrid('setCell', 37, 'NEl3x_Mcalkg', 0.85);
        feedvalGrid.grid.jqGrid('setCell', 37, 'CP', 12.4);
        feedvalGrid.grid.jqGrid('setCell', 37, 'NDF', 20.8);
        feedvalGrid.grid.jqGrid('setCell', 37, 'RUP', 3.4);
        feedvalGrid.grid.jqGrid('setCell', 37, 'RDP', 9);
        feedvalGrid.grid.jqGrid('setCell', 37, 'Lipid', 2.2);
        feedvalGrid.grid.jqGrid('setCell', 37, 'peNDF', 0);
        feedvalGrid.grid.jqGrid('setCell', 37, 'Ca', 0.06);
        feedvalGrid.grid.jqGrid('setCell', 37, 'Phos', 0.39);
        feedvalGrid.grid.jqGrid('setCell', 37, 'Starch', 60);
        feedvalGrid.grid.jqGrid('setCell', 37, 'DM', 89);
        feedvalGrid.grid.jqGrid('setCell', 37, 'Price_Unit', 10);
        feedvalGrid.grid.jqGrid('setCell', 37, 'Max lb/cow.d', 20);


        feedvalGrid.grid.jqGrid('setCell', 35, 'Ingredient', 'Alfalfa Silage');
        feedvalGrid.grid.jqGrid('setCell', 35, 'NEl3x_Mcalkg', 1.32);
        feedvalGrid.grid.jqGrid('setCell', 35, 'CP', 20);
        feedvalGrid.grid.jqGrid('setCell', 35, 'NDF', 40);
        feedvalGrid.grid.jqGrid('setCell', 35, 'RUP', 4);
        feedvalGrid.grid.jqGrid('setCell', 35, 'RDP', 16);
        feedvalGrid.grid.jqGrid('setCell', 35, 'Lipid', 2);
        feedvalGrid.grid.jqGrid('setCell', 35, 'peNDF', 32);
        feedvalGrid.grid.jqGrid('setCell', 35, 'Ca', 1.3);
        feedvalGrid.grid.jqGrid('setCell', 35, 'Phos', 0.3);
        feedvalGrid.grid.jqGrid('setCell', 35, 'Starch', 2.5);
        feedvalGrid.grid.jqGrid('setCell', 35, 'DM', 40);
        feedvalGrid.grid.jqGrid('setCell', 35, 'Price_Unit', 63.5);
        feedvalGrid.grid.jqGrid('setCell', 36, 'Ingredient', 'Grass Silage');
        feedvalGrid.grid.jqGrid('setCell', 36, 'NEl3x_Mcalkg', 1.21);
        feedvalGrid.grid.jqGrid('setCell', 36, 'CP', 16);
        feedvalGrid.grid.jqGrid('setCell', 36, 'NDF', 51);
        feedvalGrid.grid.jqGrid('setCell', 36, 'RUP', 4);
        feedvalGrid.grid.jqGrid('setCell', 36, 'RDP', 12);
        feedvalGrid.grid.jqGrid('setCell', 36, 'Lipid', 2);
        feedvalGrid.grid.jqGrid('setCell', 36, 'peNDF', 45);
        feedvalGrid.grid.jqGrid('setCell', 36, 'Ca', 0.6);
        feedvalGrid.grid.jqGrid('setCell', 36, 'Phos', 0.3);
        feedvalGrid.grid.jqGrid('setCell', 36, 'Starch', 2.5);
        feedvalGrid.grid.jqGrid('setCell', 36, 'DM', 40);
        feedvalGrid.grid.jqGrid('setCell', 36, 'Price_Unit', 47.6);

        $('tr#1').find('select.unit').append($('<option>', {
            value: 'bu',
            text: 'bu',
            selected: 'selected'
        }));
        feedvalGrid.grid.jqGrid('setCell', 1, 'Price_Unit', 3.92);
        var rows = [35, 36, 7, 8, 9, 16]

        for (var i = 1; i <= rows.length; i++) {

            $('#grid tr[id="' + rows[i - 1] + '"]').removeClass('ui-state-highlight');
            $('#grid tr[id="' + rows[i - 1] + '"]').addClass('ui-state-highlight-forage');
            //alert(i);	
        }
        rawData = feedvalGrid.grid.jqGrid('getRowData');
        //console.log(rawData);
        var NDF;
        var peNDF;
        var ingredientName;
        allIngredients = feedvalGrid.getAllIngredientIDs();
        $.each(allIngredients, function (index, ingredientID) {
            NDF = feedvalGrid.getCell(ingredientID, 'NDF');
            peNDF = feedvalGrid.getCell(ingredientID, 'peNDF');
            if (NDF > 0) {
                if (peNDF <= 0) {
                    peNDF = 0.25 * parseFloat(NDF) * 100;
                    feedvalGrid.setCell(ingredientID, 'peNDF', peNDF.toFixed(2));
                }
            }
            ingredientName = feedvalGrid.getCell(ingredientID, 'Ingredient');
            if (ingredientName == 'Tallow' || ingredientName == 'Barley')
                $('tr#' + ingredientID).find('select.unit').val('cwt');
        });

        feedvalGrid.setCell(41, 'DM', 23);
        feedvalGrid.setCell(42, 'DM', 23);
        // feedvalGrid.convertMaxToLb();

        //TODO: KG only Branch
        // feedvalGrid.convertNelToLb();
        // $('div#jqgh_grid_NEl3x_Mcalkg').text('NEl3x Mcal/lb');
        // $('div#jqgh_grid_Min_kgcowd').text('Min lb/cow.d');
        // $('div#jqgh_grid_Max_kgcowd').text('Max lb/cow.d');
        // $('div#jqgh_grid_Predicted_Value').text('Solution lb/cow.d');


        //SET ALL AS LB
        // feedvalGrid.grid.jqGrid('setCell', 'header2', 'NEl3x_Mcalkg', 'NEl3x Mcal/lb');
        // feedvalGrid.grid.jqGrid('setCell', 'header3', 'NEl3x_Mcalkg', 'NEl3x Mcal/lb');



    },

    getColumnIndex: function (columnName) {
        var colModel = feedvalGrid.grid.jqGrid('getGridParam', 'colModel');
        var iCol = -1;
        for (var i = 0; i < colModel.length; i++) {
            if (colModel[i].name === columnName) {
                iCol = i;
            }
        }
        return iCol;
    },

    selectIngredientsWithPrices: function () {
        var price, allIngredients;
        feedvalGrid.grid.jqGrid('resetSelection');
        allIngredients = feedvalGrid.getAllIngredientIDs();
        $.each(allIngredients, function (index, ingredientID) {
            price = feedvalGrid.getCell(ingredientID, 'Price_Unit');
            ing = feedvalGrid.getCell(ingredientID, 'Ingredient');
            if ($.trim(price) != '' /*&& $.trim(price) != 0*/ ) {
                feedvalGrid.grid.jqGrid('setSelection', ingredientID, false);
            } else if (ing == 'Urea') {
                feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Price_Unit', 0.24 /*472*/ ); //Hardcoding price of Urea, FIXME: find a better place for this
                feedvalGrid.grid.jqGrid('setSelection', ingredientID, false);
            }
        });
    },

    groupHeaders: function () {
        var colModel, firstNutrientName, numberOfNutrients;
        colModel = this.grid.jqGrid('getGridParam', 'colModel');
        firstNutrientName = colModel[5].name;
        numberOfNutrients = feedvalGrid.getNumberOfNutrients();
        this.grid.jqGrid('setGroupHeaders', {
            useColSpanStyle: true,
            groupHeaders: [{
                    startColumnName: firstNutrientName,
                    numberOfColumns: numberOfNutrients,
                    titleText: 'Nutrients'
                },
                {
                    startColumnName: 'DM',
                    numberOfColumns: 3,
                    titleText: 'As-Fed Basis'
                },
                {
                    startColumnName: 'Price_Unit',
                    numberOfColumns: 2,
                    titleText: 'As-Fed Basis'
                }
            ]
        });
    },

    downloadAsExcelSpreadsheet: function () {

        var columnsToAppear, data, ingredientID, unit, rawData;
        columnsToAppear = JSON.stringify(this.getWhitelistedColumns());
        rawData = this.grid.jqGrid('getRowData');
        $.each(rawData, function (rowIndex, row) {
            ingredientID = row.ID;
            unit = feedvalGrid.getUnit(ingredientID);
            row.Unit = unit;
        });
        data = JSON.stringify(rawData);


        $.ajax({
            data: {
                columnsToAppear: columnsToAppear,
                data: data
            },
            type: 'POST',
            dataType: 'json',
            success: function (data) {
                window.location.href = data.spreadsheetFilename;
            }
        });
    },

    optimizerState: function () {
        toolState = 'optimizer';

        //Making Date Selector Visible
        var date = document.getElementById("dateAndNutri");
        date.style.display = "block";

        //Binding Analyze Button to proper actions
        $('#analyze').unbind();
        $('#analyze-footer').unbind();
        $('#analyze').bind('click', function () {
            var analyzingMessage = $('#analyzing');
            analyzingMessage.show();
            feedvalGrid.analyze();
            analyzingMessage.hide();

        });

        $('#analyze-footer').bind('click', function () {
            var analyzingMessage = $('#analyzing');
            analyzingMessage.show();
            feedvalGrid.analyze();
            analyzingMessage.hide();
        });
        $('#analyze').text("Least Cost Optimization");
        $('#analyze-footer').text("Least Cost Optimization");


        feedvalGrid.setCell('data4', 'Predicted_Value', " ");

        //Hiding Columns and making Changes to Min_kgcowd field
        hiddenCol = ["Predicted_Value", "Max_kgcowd"]
        $.each(hiddenCol, function (i, ID) {
            feedvalGrid.grid.jqGrid('showCol', ID);
        });
        feedvalGrid.setCell('header2', 'Min_kgcowd', 'Min lb/cow.d');
        $('div#jqgh_grid_Min_kgcowd').text('Min lb/cow.d');


        // Resets the results
        feedvalGrid.clearResults();

        //Set min to 0
        allIngredientIDs = feedvalGrid.getAllIngredientIDs();

        $.each(allIngredientIDs, function (index, ingredientID) {

            if (ingredientID == 'separator' || ingredientID == 'header2' || ingredientID == '41' || ingredientID == '42') {
                return true;
            }


            var color = feedvalGrid.getBackgroundColor(0);
            feedvalGrid.setCell(ingredientID, 'Min_kgcowd', 0, {
                "background-color": color
            });
        });

        $('#eq_result').text('');

        //Color row if value is higher than 0 in evaluator state
        // feedvalGrid.formatNonZeroRow();

        var allIngredientIDs = feedvalGrid.getAllIngredientIDs();

        if (toolState == 'evaluator') {
            $.each(allIngredientIDs, function (i, ingredientID) {
                ingredientID = Number(ingredientID);
                var Min_kgcowd = feedvalGrid.getCell(ingredientID, 'Min_kgcowd');
                if (Min_kgcowd > 0) { //deleted
                    console.log("Formatting: " + ingredientID);
                    $('#grid tr[id^="' + ingredientID + '"]').addClass("nonZeroRow");
                } else {
                    $('#grid tr[id^="' + ingredientID + '"]').removeClass("nonZeroRow");
                }
            });
        } else {
            $.each(allIngredientIDs, function (i, ingredientID) {
                $('#grid tr[id^="' + ingredientID + '"]').removeClass("nonZeroRow");
            });
        }

    },

    evaluatorState: function () {



        toolState = 'evaluator';

        // var date = document.getElementById("dateAndNutri");
        // date.style.display = "none";
        // console.log("Hiding date");

        //Binding Analyze Button to proper actions
        $('#analyze').unbind();
        $('#analyze-footer').unbind();
        $('#analyze').bind('click', function () {
            var analyzingMessage = $('#analyzing');
            analyzingMessage.show();
            feedvalGrid.calculateEvaluator();
            analyzingMessage.hide();
        });

        $('#analyze-footer').bind('click', function () {
            var analyzingMessage = $('#analyzing');
            analyzingMessage.show();
            feedvalGrid.calculateEvaluator();
            analyzingMessage.hide();
        });
        $('#analyze').text("Calculate");
        $('#analyze-footer').text("Calculate");


        var dollarperDM = feedvalGrid.getLBperDMCalculation() + "$/lb DM";
        var solutionAmount;


        feedvalGrid.setCell('data4', 'Predicted_Value', dollarperDM);



        hideCol = ["Predicted_Value", "Max_kgcowd"]


        $.each(hideCol, function (i, ID) {
            feedvalGrid.grid.jqGrid('hideCol', ID);
        });


        feedvalGrid.setCell('header2', 'Min_kgcowd', 'Amount Provided kg/cow.d');
        $('div#jqgh_grid_Min_kgcowd').text('Amount Provided kg/cow.d');


        allIngredientIDs = feedvalGrid.getAllIngredientIDs();

        $.each(allIngredientIDs, function (index, ingredientID) {

            if (ingredientID == 'separator' || ingredientID == 'header2' || ingredientID == '41' || ingredientID == '42') {
                return true;
            }

            solutionAmount = Number(feedvalGrid.grid.jqGrid('getCell', ingredientID, "Predicted_Value"));;


            var color = feedvalGrid.getBackgroundColor(solutionAmount);
            feedvalGrid.setCell(ingredientID, 'Min_kgcowd', solutionAmount.toFixed(3), {
                "background-color": color
            });
        });

        //Color row if value is higher than 0 in evaluator state
        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        $.each(allIngredientIDs, function (index, ingredientID) {
            Min_kgcowd = feedvalGrid.getCell(ingredientID, 'Min_kgcowd');
            if (Min_kgcowd > 0) {
                $('#grid tr[id^="' + ingredientID + '"]').addClass("nonZeroRow");
            }
        });

    },

    getBackgroundColor: function (price) {
        var indicators = {
            good: '#99FF66',
            bad: '#FF9696',
            neutral: 'transparent'
        };
        if (price > 0) {
            return indicators.good;
        } else if (price == 0) {
            return indicators.neutral;
        } else {
            return indicators.bad;
        }
    },

    getWhitelistedColumns: function () {
        var whitelistedColumns = [],
            colModel;
        colModel = this.grid.jqGrid('getGridParam', 'colModel');
        $.each(colModel, function (index, col) {
            if (col.label && (col.hidden == false || $.inArray(col.name, feedvalGrid.requiredColumns) >= 0)) {
                whitelistedColumns.push(col.name);
            }
        });

        return whitelistedColumns;
    },

    createDatePicker: function () {
        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        $.ajax({
            data: {
                getMinMaxDates: 1
            },
            type: 'GET',
            dataType: 'json',
            success: function (result) {
                $('.input-group.date').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true,
                    todayBtn: 'linked',
                    todayHighlight: true,
                    startDate: result.minDate,
                    endDate: result.maxDate
                }).datepicker('setDate', date).on('changeDate', function (e) {
                    feedvalGrid.updatePrices(e.date);
                });
            }
        });
    },
    convertMaxToLb: function () {
        var allIngredientIDs, ingredients = [],
            price;
        feedvalGrid.clearResults();
        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        $.each(allIngredientIDs, function (index, ingredientID) {
            max = feedvalGrid.getCell(ingredientID, 'Max_kgcowd');
            if (max && ingredientID < 41) {
                max = parseFloat(max) * 2.20462;
                feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Max_kgcowd', max.toFixed(2));
            }
        });
        feedvalGrid.grid.jqGrid('setCell', 41, 'DM', 50.71);
        feedvalGrid.grid.jqGrid('setCell', 42, 'DM', 50.71);
        feedvalGrid.grid.jqGrid('setCell', 'header3', 'DM', 'lb DM');
    },
    convertNelToLb: function () {
        var allIngredientIDs, ingredients = [],
            price;
        feedvalGrid.clearResults();

        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        $.each(allIngredientIDs, function (index, ingredientID) {
                max = feedvalGrid.getCell(ingredientID, 'NEl3x_Mcalkg');
                if (max) {
                    max = parseFloat(max) / 2.20462;
                    feedvalGrid.grid.jqGrid('setCell', ingredientID, 'NEl3x_Mcalkg', max.toFixed(2));
                }
            }

        );
        // feedvalGrid.grid.jqGrid('setCell', 41, 'DM', 50.71);
        // feedvalGrid.grid.jqGrid('setCell', 42, 'DM', 50.71);
        // feedvalGrid.grid.jqGrid('setCell', 'header3', 'DM', 'lb DM');
    },

    convertSolutionToLB: function (solutionVector) {
        console.log("Solution vector Length before converting");
        console.log(solutionVector.length);
        for (var i = 0; i < solutionVector.length - 5; i++) {
            solutionVector[i] = solutionVector[i] * 2.2046;
        }
    },

    convertValsToLb: function () {
        var allIngredientIDs, ingredients = [],
            price;
        feedvalGrid.clearResults();
        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        var cur_maxNEL = feedvalGrid.grid.jqGrid('getCell', 'header2', 'NEl3x_Mcalkg');


        $.each(allIngredientIDs, function (index, ingredientID) {
            max = feedvalGrid.getCell(ingredientID, 'Max_kgcowd');
            var cur_max = feedvalGrid.grid.jqGrid('getCell', 'header2', 'Max_kgcowd');
            if (max && ingredientID < 41 && cur_max.includes('kg')) {
                max = parseFloat(max) * 2.20462;
                feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Max_kgcowd', max.toFixed(2));
            }
            //AJ EDIT 7/9/2018
            maxNEL = feedvalGrid.getCell(ingredientID, 'NEl3x_Mcalkg');
            //console.log(maxNEL);

            if (maxNEL && cur_maxNEL.includes('kg')) {
                maxNEL = parseFloat(maxNEL) / 2.20462;
                feedvalGrid.grid.jqGrid('setCell', ingredientID, 'NEl3x_Mcalkg', maxNEL.toFixed(2));
            }
        });

        if (toolState == 'Optimizer') {
            $('div#jqgh_grid_Min_kgcowd').text('Min lb/cow.d');
            feedvalGrid.setCell('header2', 'Min_kgcowd', 'Min lb/cow.d');

            $('div#jqgh_grid_Max_kgcowd').text('Max lb/cow.d');
            feedvalGrid.setCell('header2', 'Max_kgcowd', 'Max lb/cow.d');
        } 

        $('div#jqgh_grid_NEl3x_Mcalkg').text('NEl3x Mcal/lb');
        feedvalGrid.grid.jqGrid('setCell', 'header2', 'NEl3x_Mcalkg', 'NEl3x Mcal/lb');
        feedvalGrid.grid.jqGrid('setCell', 'header3', 'NEl3x_Mcalkg', 'NEl3x Mcal/lb');
        $('div#jqgh_grid_Predicted_Value').text('Solution lb/cow.d');

        feedvalGrid.grid.jqGrid('setCell', 41, 'DM', 50.71);
        feedvalGrid.grid.jqGrid('setCell', 42, 'DM', 50.71);
        feedvalGrid.grid.jqGrid('setCell', 'header2', 'DM', 'lb DM');
        feedvalGrid.grid.jqGrid('setCell', 'header3', 'DM', 'lb DM');

        //07/31/2018 Update Conditi

    },

    convertValsToKg: function () {
        var allIngredientIDs, ingredients = [],
            price;
        feedvalGrid.clearResults();
        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        var cur_maxNEL = feedvalGrid.grid.jqGrid('getCell', 'header2', 'NEl3x_Mcalkg');


        $.each(allIngredientIDs, function (index, ingredientID) {
            max = feedvalGrid.getCell(ingredientID, 'Max_kgcowd');
            var cur_max = feedvalGrid.grid.jqGrid('getCell', 'header2', 'Max_kgcowd');
            if (max && ingredientID < 41 && cur_max.includes('lb')) {
                max = parseFloat(max) / 2.20462;
                feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Max_kgcowd', max.toFixed(2));
            }
            //AJ EDIT 7/9/2018
            maxNEL = feedvalGrid.getCell(ingredientID, 'NEl3x_Mcalkg');




            if (ingredientID == 42 || ingredientID == 41) {
                // console.log(maxNEL);
                // console.log(cur_maxNEL);

            }

            if (maxNEL && cur_maxNEL.includes('lb')) {
                // console.log('ingredientID: ')
                // console.log(ingredientID)
                maxNEL = parseFloat(maxNEL) * 2.20462;
                feedvalGrid.grid.jqGrid('setCell', ingredientID, 'NEl3x_Mcalkg', maxNEL.toFixed(2));
            }

        });

        // console.log(feedvalGrid.grid.jqGrid('getCell', '42', 'NEl3x_Mcalkg'));
        if (toolState == 'Optimizer') {
            $('div#jqgh_grid_Min_kgcowd').text('Min kg/cow.d');
            feedvalGrid.setCell('header2', 'Min_kgcowd', 'Min kg/cow.d');
            $('div#jqgh_grid_Max_kgcowd').text('Max kg/cow.d');
            feedvalGrid.setCell('header2', 'Max_kgcowd', 'Max kg/cow.d');
            $('div#jqgh_grid_Predicted_Value').text('Solution kg/cow.d');
        }


        $('div#jqgh_grid_NEl3x_Mcalkg').text('NEl3x Mcal/kg');
        // feedvalGrid.setCell('header2', 'NEl3x Mcal/lb', 'NEl3x Mcal/kg');
        feedvalGrid.grid.jqGrid('setCell', 'header2', 'NEl3x_Mcalkg', 'NEl3x Mcal/kg');
        feedvalGrid.grid.jqGrid('setCell', 'header3', 'NEl3x_Mcalkg', 'NEl3x Mcal/kg');

        feedvalGrid.grid.jqGrid('setCell', 41, 'DM', 23);
        feedvalGrid.grid.jqGrid('setCell', 42, 'DM', 23);
        feedvalGrid.grid.jqGrid('setCell', 'header3', 'DM', 'kg DM');


    },
    convertToLb: function () {
        var allIngredientIDs, ingredients = [],
            price;
        feedvalGrid.clearResults();
        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        $.each(allIngredientIDs, function (index, ingredientID) {
            price = feedvalGrid.getCell(ingredientID, 'Price_Unit');
            if (price) {
                ingredients.push({
                    ingredientName: feedvalGrid.getCell(ingredientID, 'Ingredient'),
                    ingredientID: ingredientID,
                    price: price,
                    fromUnit: feedvalGrid.getUnit(ingredientID),
                    toUnit: 'lb'
                });
            }
        });
        feedvalGrid.convertUnits(ingredients).done(function (pricesInKG) {

            var priceInKG;
            $.each(allIngredientIDs, function (index, ingredientID) {
                $('tr#' + ingredientID).find('select.unit').val('lb');
                $('table#grideval').find('tr#' + ingredientID).find('select.unit').val('lb');
                if (pricesInKG[ingredientID]) {
                    priceInKG = parseFloat(pricesInKG[ingredientID]);
                    feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceInKG.toFixed(3));
                }
            });
        });

    },
    convertToKg: function () {
        var allIngredientIDs, ingredients = [],
            price;
        feedvalGrid.clearResults();
        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        $.each(allIngredientIDs, function (index, ingredientID) {
            price = feedvalGrid.getCell(ingredientID, 'Price_Unit');
            if (price) {
                ingredients.push({
                    ingredientName: feedvalGrid.getCell(ingredientID, 'Ingredient'),
                    ingredientID: ingredientID,
                    price: price,
                    fromUnit: feedvalGrid.getUnit(ingredientID),
                    toUnit: 'kg'
                });
            }
            /*    max = feedvalGrid.getCell(ingredientID, 'Max_kgcowd');
		var cur_max = feedvalGrid.grid.jqGrid('getCell', 'header2', 'Max_kgcowd');
                if (max && ingredientID<41 && cur_max.includes('lb')) {
		    max = parseFloat(max)/2.20462;
		    feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Max_kgcowd', max.toFixed(2));
                }*/
        });
        feedvalGrid.convertUnits(ingredients).done(function (pricesInKG) {

            var priceInKG;
            $.each(allIngredientIDs, function (index, ingredientID) {
                $('tr#' + ingredientID).find('select.unit').val('kg');
                $('table#grideval').find('tr#' + ingredientID).find('select.unit').val('kg');
                if (pricesInKG[ingredientID]) {
                    priceInKG = parseFloat(pricesInKG[ingredientID]);
                    feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceInKG.toFixed(3));
                }
            });
        });
        /*$('div#jqgh_grid_Min_kgcowd').text('Min kg/cow.d');
        feedvalGrid.setCell('header2', 'Min_kgcowd', 'Min kg/cow.d');
        $('div#jqgh_grid_Max_kgcowd').text('Max kg/cow.d');
        feedvalGrid.setCell('header2', 'Max_kgcowd', 'Max kg/cow.d');
        $('div#jqgh_grid_Predicted_Value').text('Solution kg/cow.d');
        feedvalGrid.grid.jqGrid('setCell', 41, 'DM', 23);
        feedvalGrid.grid.jqGrid('setCell', 42, 'DM', 23);
        feedvalGrid.grid.jqGrid('setCell', 'header3', 'DM', 'kg DM');
        */

    },

    updatePrices: function (date) {
        //alert("in update prices");
        var columnsToClear, select, unit, ingredientName, price;
        var allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        $.ajax({
            data: {
                pricesForDate: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
            },
            type: 'GET',
            dataType: 'json',
            success: function (prices) {
                columnsToClear = ['Price_Unit'];
                feedvalGrid.clearColumns(columnsToClear);

                $.each(prices, $.proxy(function (ingredientID, priceAndUnit) {
                    feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceAndUnit['price']);
                    select = feedvalGrid.getCell(ingredientID, 'Unit');
                    $(select).val(priceAndUnit['unit']);
                }, this));

                $.each(allIngredientIDs, function (index, ingredientID) {

                    unit = feedvalGrid.getUnit(ingredientID);
                    price = feedvalGrid.getCell(ingredientID, 'Price_Unit');
                    ingredientName = feedvalGrid.getCell(ingredientID, 'Ingredient');
                    if (unit == 'kg' || price == '') {
                        $('tr#' + ingredientID).find('select.unit').val('ton');

                    }
                    if (ingredientName == 'Tallow' || ingredientName == 'Barley')
                        $('tr#' + ingredientID).find('select.unit').val('cwt');

                });
                feedvalGrid.selectIngredientsWithPrices();
                feedvalGrid.clearResults();
            }
        })



        //console.log(feedvalGrid.getSelectedIngredientIDs());

    }


}; // End of feedvalGrid.






$(document).ready(function () {
    // Default AJAX settings.
    $.ajaxSetup({
        // We use the same URL for all AJAX calls.
        url: 'ajax.php',
        // A default error handler.
        error: feedvalGrid.AJAXError,
        beforeSend: function () {
            $.blockUI.defaults.css = {
                padding: 0,
                margin: 0,
                width: '30%',
                top: '10%',
                left: '35%',
                cursor: 'wait'
            };
            $.blockUI({
                message: $('#request-in-progress')
            });
        },
        complete: function () {
            $.unblockUI();
        }
    });
    feedvalGrid.createModals();
    feedvalGrid.createDatePicker();
    bindElements();

    // Get the settings required for the grid and create it.
    $.ajax({
        dataType: 'json',
        type: 'POST',
        success: feedvalGrid.createGrid
    });

    // Upload excel spreadsheet
    $('#upload_form').ajaxForm({
        dataType: 'json',
        type: 'POST',
        beforeSubmit: function (data) {
            console.log();
            var selectedFile = $('input[name=data_file]').val();
            if (selectedFile == '') {
                alert('Please select a file to upload.');
                return false;
            }
            return true;
        },
        success: function (data) {
            feedvalGrid.grid.jqGrid('GridUnload', '#grid');
            feedvalGrid.createGrid(data);
        }
    });

    function bindElements() {

        $('#analyze').bind('click', function () {
            var analyzingMessage = $('#analyzing');
            analyzingMessage.show();
            //FIXME:Check Improve calculateMinimization
            //feedvalGrid.calculateMinimization();
            feedvalGrid.analyze();
            analyzingMessage.hide();
        });

        $('#analyze-footer').bind('click', function () {
            var analyzingMessage = $('#analyzing');
            analyzingMessage.show();
            //FIXME:Check Improve calculateMinimization
            //feedvalGrid.calculateMinimization();
            feedvalGrid.analyze();
            analyzingMessage.hide();
        });


        $('.download').bind('click', function () {
            feedvalGrid.downloadAsExcelSpreadsheet();
        });

        $('.optimizer').bind('click', function () {
            feedvalGrid.optimizerState();
            //Optimizer State sequence
        });

        $('.evaluator').bind('click', function () {
            feedvalGrid.evaluatorState();
            //Evaluator State sequence
        });

        $('#supporting-documents').find('select').bind('change', function (event) {
            var prefix, pdfFilename, xlsFilename, supportingDocuments;
            prefix = 'monthly_analysis/' + $(event.target).val();
            pdfFilename = prefix + '.pdf';
            xlsFilename = prefix + '.xls';
            supportingDocuments = $('#supporting-documents');
            supportingDocuments.find('a.pdf').attr('href', pdfFilename);
            supportingDocuments.find('a.xls').attr('href', xlsFilename);
        });

        feedvalGrid.checkbox = $('input[name="remove_negative_price_nutrients"]');
        feedvalGrid.checkbox.change(function () {
            feedvalGrid.clearResults();
        });

        $('#data_file').change(function () {
            feedvalGrid.clearResults();
        });

        $('#convert-prices-to-kgs').bind('click', function () {
            if ($('#convert-prices-to-kgs').text().includes('kg')) {
                $('#convert-prices-to-kgs').text('Convert prices to lb');
                $('#convert-prices-to-kgscalc').text('Convert prices to lb');
                // feedvalGrid.convertToKg();
                // feedvalGrid_calc.convertToKg();
            } else {
                $('#convert-prices-to-kgs').text('Convert prices to kg');
                $('#convert-prices-to-kgscalc').text('Convert prices to kg');
                //feedvalGrid.convertToLb();
                // feedvalGrid_calc.convertToLb();

            }
        });

        $('#convert-to-kgs').bind('click', function () {
            if ($('#convert-to-kgs').text().includes('kg')) {
                $('#convert-to-kgs').text('Convert amounts to lb');
                $('#convert-to-kgscalc').text('Convert amounts to lb');
                // feedvalGrid.convertValsToKg();
                // feedvalGrid_calc.convertValsToKg();
            } else {
                $('#convert-to-kgs').text('Convert amounts to kg');
                $('#convert-to-kgscalc').text('Convert amouunts to kg');
                // feedvalGrid.convertValsToLb();
                // feedvalGrid_calc.convertValsToLb();
            }
            //feedvalGrid_calc.convertToKg();
        });
    }

});