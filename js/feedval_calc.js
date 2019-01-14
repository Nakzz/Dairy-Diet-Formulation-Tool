/**
 * The FeedVal 2012 grid.
 */
var max_value = 0;
var feedvalGrid_calc = {
    grid: {},
    nutrients: null,
    requiredColumns: ['Selected', 'DM', 'Price_Unit', 'Unit', 'Predicted_Value', 'Actual_Price'],
    invalidSelectionModal: null,
    ajaxErrorModal: null,
    nutrientsSelectBox: null,
    checkbox: null,

    getNumberOfNutrients: function () {
        return $.map(feedvalGrid_calc.nutrients, function (element) {
            return element;
        }).length;
    },

    convertUnits: function (ing) {
        var ingredients;
        //console.log(ing);
        if (ing.ingredientName !== undefined) {
            ingredients = [ing];
        } else {
            ingredients = ing;
        }
        //console.log(ingredients);
        return $.ajax({
            data: {
                ingredients: ingredients,
                convertUnits: true
            },
            type: 'POST',
            dataType: 'json'
        });
    },

    selectionValid: function () {
        return (!this.getSelectedNutrientsNotPresentInAnySelectedFeed().length /*&& !(this.getNumberIngredientsBiggerThanNumberNutrients()<0)*/);
    },

    onlyRupRdpSelected: function () {
        var selectedNutrients;
        selectedNutrients = feedvalGrid_calc.getSelectedNutrients();
        return selectedNutrients.length == 2 &&
            $.grep(selectedNutrients, function (nutrient) {
                return nutrient.indexOf('RUP') >= 0 ||
                    nutrient.indexOf('RDP') >= 0;
            }).length == 2;
    },

    getSelectedNutrientsNotPresentInAnySelectedFeed: function () {
        var selectedIngredientIDs, selectedNutrients, nutrientCoefficientMatrix, matrixColumnNumber,
            nutrientCoefficients, allZeroes, selectedNutrientNotPresentInAnySelectedFeed = [];

        selectedIngredientIDs = feedvalGrid_calc.getSelectedIngredientIDs();
        //console.log(selectedIngredientIDs)
	selectedNutrients = feedvalGrid.getSelectedNutrients();
        nutrientCoefficientMatrix = feedvalGrid_calc.getNutrientCoefficientMatrix(selectedIngredientIDs);

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

    getNumberIngredientsBiggerThanNumberNutrients: function() {

	var selectedIngredientIDs, selectedNutrients, differenceSelIngredientsSelNutrients;
	selectedNutrients = feedvalGrid.getSelectedNutrients();
        //alert(selectedNutrients.length);
	selectedIngredientIDs = feedvalGrid_calc.getSelectedIngredientIDs(); 
        //alert(selectedIngredientIDs.length);
	differenceSelIngredientsSelNutrients = selectedIngredientIDs.length - selectedNutrients.length;

	return differenceSelIngredientsSelNutrients;

    },  



    cpSelectedWithRupOrRdp: function () {
        var selectedNutrients;
        selectedNutrients = feedvalGrid_calc.getSelectedNutrients();
        return $.grep(selectedNutrients, function (nutrient) {
            return nutrient.indexOf('CP') >= 0;
        }).length == 1 &&
            $.grep(selectedNutrients, function (nutrient) {
                return nutrient.indexOf('RUP') >= 0 ||
                    nutrient.indexOf('RDP') >= 0;
            }).length >= 1;
    },

    getSelectedIngredientIDs: function () {
        return this.grid.jqGrid('getGridParam', 'selarrrow');
    },

    getNonSelectedIngredientIDs: function () {
        var allIngredientIDs, selectedIngredientIDs,NonSelectedIngredientIDs = [];
	selectedIngredientIDs = this.grid.jqGrid('getGridParam', 'selarrrow');
	allIngredientIDs = this.grid.jqGrid('getDataIDs'); 

	$.each(allIngredientIDs, function (index, ingredientID) {
                var hits = 0;
		$.each(selectedIngredientIDs, function (selIndex, selIngredientID) {
			if(ingredientID == selIngredientID) {
			hits++;
			}
		});
		if(hits == 0)
		{
			NonSelectedIngredientIDs.push(ingredientID);
        	}
			
	});	
	return NonSelectedIngredientIDs;
    },

    getSelectedNutrients: function () {
        var colModel, selectedNutrients = [];
        colModel = this.grid.jqGrid('getGridParam', 'colModel');
        $.each(colModel, function (colIndex, col) {
            if ((col.hidden == false) && (col.hidedlg == false)) {
                selectedNutrients.push(this.name);
            }
        });

        return selectedNutrients;
    },

    getFeedPrices: function (ingredientIDs) {
        var ingredients = [];
        $.each(ingredientIDs, function (index, ingredientID) {
	ingredients[index] = {
                ingredientName: feedvalGrid_calc.getCell(ingredientID, 'Ingredient'),
                ingredientID: ingredientID,
                price: feedvalGrid_calc.getCell(ingredientID, 'Price_Unit'),
                fromUnit: feedvalGrid_calc.getUnit(ingredientID),
                toUnit: 'Lb'
            };
        });
        //console.log(ingredients);	
	return feedvalGrid_calc.convertUnits(ingredients);
    },

    getUnit: function (ingredientID) {
        //return $('tr#' + ingredientID).find('select.unit').val();
        return $('table#grideval').find('tr#' + ingredientID).find('select.unit').val();
    },

    getCell: function (ingredientID, columnName) {
        var cellValue, colLabel;
        cellValue = feedvalGrid_calc.grid.jqGrid('getCell', ingredientID, columnName);
        colLabel = feedvalGrid_calc.grid.jqGrid('getColProp', columnName).label;
        if (colLabel.indexOf('%') >= 0) {
            return parseFloat(cellValue) / 100;
        } else {
            return cellValue;
        }
    },

    getNutrientCoefficientMatrix: function (ingredientIDs) {
        var nutrientsArray = [];
	var nutrient_value;
	var blank_counter = 0;
        $.each(ingredientIDs, function (ingredientIndex, ingredientID) {
            nutrientsArray[ingredientIndex] = [];
             //alert('ingredientID: ' + ingredientID + 'ingredientIndex: ' + ingredientIndex);
	    $.each(feedvalGrid_calc.getSelectedNutrients(), function (nutrientIndex, nutrientName) {
                //alert('ingredientID: ' + ingredientID + ', ingredientIndex: ' + ingredientIndex + ', nutrientIndex: ' + nutrientIndex + ', nutrientName: ' + nutrientName +  ', value: ' + feedvalGrid_calc.getCell(ingredientID, nutrientName) );
		nutrient_value =  feedvalGrid_calc.getCell(ingredientID, nutrientName);
		if ((nutrient_value == '') || isNaN(nutrient_value) )
		{
		nutrientsArray[ingredientIndex][nutrientIndex] = 0;
                blank_counter++;
		}
		else
		{
		 nutrientsArray[ingredientIndex][nutrientIndex] = nutrient_value;
                }
            });
	//if(blank_counter >0)
	//	alert('There are blank values in some of your nutrient values. They are taking a zero for Analysis purposes');
        });

        return Matrix.create(nutrientsArray);
    },

    getDryMatterValue: function (ingredientID) {
        return feedvalGrid_calc.getCell(ingredientID, 'DM');
    },

    getFeedPriceMatrix: function (feedPrices, selectedIngredientIDs) {
        var dryMatterValue, fp = [];
	var feedPrice;
              $.each(selectedIngredientIDs, function (index, ingredientID) {
		    feedPrice = feedPrices[ingredientID];
		    if (feedPrice !== undefined) {
                	dryMatterValue = feedvalGrid_calc.getDryMatterValue(ingredientID);
			fp.push([feedPrice / dryMatterValue]);
            		}

		});
 	
        return Matrix.create(fp);
    },

    getFeedPriceMatrixAll: function (feedPrices, selectedIngredientIDs) {
        var dryMatterValue, fp = [];
        var feedPrice;
              $.each(selectedIngredientIDs, function (index, ingredientID) {
                    feedPrice = feedPrices[ingredientID];
                    if (feedPrice !== undefined) {
                        dryMatterValue = feedvalGrid_calc.getDryMatterValue(ingredientID);
                        fp.push([feedPrice / dryMatterValue]);
                        }

                });

        return Matrix.create(fp);
    },


    displaySelectionErrorMessage: function () {
        var rupRdpCpSelected, nutrientsToBeRemoved, onlyRupRdpSelected, numberIngredientBiggerNumberNutrients;
        feedvalGrid_calc.invalidSelectionModal.find('li').hide();

        rupRdpCpSelected = this.cpSelectedWithRupOrRdp();
        if (rupRdpCpSelected) {
            feedvalGrid_calc.showRupRdpCpSelectedMessage(); 
        }

        onlyRupRdpSelected = this.onlyRupRdpSelected();
        //FIXME:Eventually check if this catch is correct or not
	/*
        if (onlyRupRdpSelected) {
            feedvalGrid_calc.showOnlyRupRdpSelectedMessage(); 
        }
	*/

        nutrientsToBeRemoved = feedvalGrid_calc.getSelectedNutrientsNotPresentInAnySelectedFeed();
        if (nutrientsToBeRemoved.length) {
            feedvalGrid_calc.showNutrientsToBeRemovedMessage(nutrientsToBeRemoved);
        }

	numberIngredientBiggerNumberNutrient = feedvalGrid_calc.getNumberIngredientsBiggerThanNumberNutrients();
	if (numberIngredientBiggerNumberNutrient < 0) {
	    //feedvalGrid_calc.showNotnumberIngredientBiggerNumberNutrientMessage();
	    //alert('The Number of Ingredients has to be bigger or equal than the selected number of nutrients');
	}
	
	if (!feedvalGrid_calc.selectionValid()) {
            feedvalGrid_calc.invalidSelectionModal.modal('show');
        }
    },

    showOnlyRupRdpSelectedMessage: function () {
        feedvalGrid_calc.invalidSelectionModal.find('#rup_rdp').show();
    },

    showRupRdpCpSelectedMessage: function () {
        return false;
        feedvalGrid_calc.invalidSelectionModal.find('#rup_rdp_cp').show();
    },

    showNutrientsToBeRemovedMessage: function (nutrientsToBeRemoved) {
        return false;
        feedvalGrid_calc.invalidSelectionModal.find('#nut_all_zeroes').show().find('span').text(nutrientsToBeRemoved.join(', '));
    },

    showNotnumberIngredientBiggerNumberNutrientMessage: function () {
	feedvalGrid_calc.invalidSelectionModal.find('#NumIngBigNumNut').show();
    },

    clearColumns: function (columnsToClear) {
        var ingredients;
        ingredients = feedvalGrid_calc.getAllIngredientIDs();
        $.each(columnsToClear, function (columnIndex, columnName) {
            $.each(ingredients, function (ingredientIndex, ingredientID) {
                feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, columnName, null, {"background-color": 'transparent'});
            });
        });
    },

    clearResults: function () {
        var summaryRow, resultColumns;

        resultColumns = ['Actual_Price', 'Predicted_Value'];
        feedvalGrid_calc.clearColumns(resultColumns);

        summaryRow = feedvalGrid_calc.grid.jqGrid('footerData', 'get');
        $.each(summaryRow, function (columnName) {
            summaryRow[columnName] = null;
        });
        feedvalGrid_calc.grid.jqGrid('footerData', 'set', summaryRow, false);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'Ingredient', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'NEl3x_Mcalkg', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'CP', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'Ca', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'NDF', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'RUP', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'RDP', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'Lipid', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'peNDF', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'Phos', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'Starch', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'DM', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'Min_kgcowd', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data3', 'Price_Unit', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data4', 'DM', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data5', 'DM', null);
	feedvalGrid_calc.grid.jqGrid('setCell', 'data4', 'Min_kgcowd', null);
        $('#r_square, #adjusted_r_square').text('');
    },

    getAllIngredientIDs: function () {
        return feedvalGrid_calc.grid.jqGrid('getDataIDs');
    },


    getPredictedFeedPriceMatrix: function (nutrientCoefficientMatrix, predictedNutrientPriceMatrix) {
        return nutrientCoefficientMatrix.x(predictedNutrientPriceMatrix);
    },

    analyze: function () {
        
        var predictedNutrientPriceMatrix, nutrientCoefficientMatrix, selectedIngredientIDs,
            predictedFeedPriceMatrix, allIngredientIDs, percentageDifferenceMatrix,
            selectedNutrients, rSquare, adjustedRSquare, actualFeedPriceMatrix;

	var nonSelectedIngredientIDs, predictedNutrientPriceMatrixNonSelected,percentageDifferenceMatrixNonSelected,  
	    percentageDifferenceMatrixNonSelected, actualFeedPriceMatrixNonSelected; 	    


	var solutionVector, solutionArray;
 
        feedvalGrid_calc.saveGrid();
        if (!this.selectionValid()) {
            this.displaySelectionErrorMessage();
            return;
        }

        allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
        selectedIngredientIDs = feedvalGrid_calc.getSelectedIngredientIDs(); 
        //FIXME
	//console.log(selectedIngredientIDs)
	nonSelectedIngredientIDs = feedvalGrid_calc.getNonSelectedIngredientIDs(); //NEW
	selectedNutrients = feedvalGrid_calc.getSelectedNutrients();
	
        feedvalGrid_calc.getFeedPrices(selectedIngredientIDs).done(function (actualFeedPrices) {
        actualFeedPriceMatrix = feedvalGrid_calc.getFeedPriceMatrix(actualFeedPrices,selectedIngredientIDs);

        //FIXME:Check Improve calculateMinimization
	var columnsToAppear, data, ingredientID, unit, rawData;
        columnsToAppear = JSON.stringify(feedvalGrid_calc.getWhitelistedColumns());
        rawData = feedvalGrid_calc.grid.jqGrid('getRowData');
        //rawData = feedvalGrid.grid.jqGrid('getRowData');//FIXME: changed to feedvalGrid.grid to get data from optimizer
        //console.log("raw data Grid.grid");
        //console.log(rawData);
        var valMax = 0;
        $.each(rawData, function (rowIndex, row) {
            ingredientID = row.ID;
            unit = feedvalGrid_calc.getUnit(ingredientID);
            row.Unit = unit;
            if (row.Price_Unit == ""){
            	row.Selected = "NO";
            }
            if(row.Ingredient=='Max'){
                valMax = row.DM;
            }
        });
        data = JSON.stringify(rawData);
        //console.log(data);
        //console.log(selectedIngredientIDs)
	//console.log(feedvalGrid_calc.getSelectedIngredientIDs())
        //solutionArray = calculateMinimization(data, columnsToAppear);
        
        rawData = feedvalGrid_calc.grid.jqGrid('getRowData');
        
        var new_solution = [];
        $.each(rawData, function (rowIndex, row) {
            ingredientID = row.ID;
            if(ingredientID=='header2'){
                return false;
            }
            new_solution.push(parseFloat(row.Min_kgcowd));
        });
//            solutionVector = arrMin0;
            solutionVector = new_solution;
        //solutionVector = solutionArray['0'];    
	//console.log('solutionVector');
	//console.log(solutionVector);
        
        //console.log(selectedIngredientIDs)    
	    predictedNutrientPriceMatrix = calculatePredictedNutrientPrices();;
	//console.log(predictedNutrientPriceMatrix)    
	if (needToRemoveNutrientsWithNegativePredictedPrices()) {
                removeNutrientsWithNegativePredictedPrices();
                feedvalGrid_calc.analyze();
                return;
            }
	    
            nutrientCoefficientMatrix = feedvalGrid_calc.getNutrientCoefficientMatrix(allIngredientIDs);
             
	    predictedFeedPriceMatrix = feedvalGrid_calc.getPredictedFeedPriceMatrix(nutrientCoefficientMatrix, predictedNutrientPriceMatrix);
            percentageDifferenceMatrix = getPercentageDifferenceMatrix();


            rSquare = calculateRSquare();
            adjustedRSquare = calculateAdjustedRSquare();

//            console.dir('xxxx');
//            console.dir(predictedNutrientPriceMatrix);
//            console.dir(valMax);
            
//            console.dir(data);
//            console.dir(rawData);
//
            displaySolutionVector(solutionVector);
            displayPredictedNutrientPrices(predictedNutrientPriceMatrix,valMax,rawData);
	    //displayPredictedFeedPrices(predictedFeedPriceMatrix.elements); //FIXME:Change this for solution vector
            
            //displayPercentageDifferences(percentageDifferenceMatrix.elements);
	    //displayRSquares();
//	displayEqResult(solutionArray['2']); 
	    //displayPredictedNonSelected(predictedFeedPriceMatrix.elements);
        });


        function calculateMinimization(data,columnsToAppear) {
        //var columnsToAppear, data, ingredientID, unit, rawData;
        var solutionArray;
        //columnsToAppear = JSON.stringify(feedvalGrid_calc.getWhitelistedColumns());
        //rawData = feedvalGrid_calc.grid.jqGrid('getRowData');
        //$.each(rawData, function (rowIndex, row) {
            //ingredientID = row.ID;
            //unit = feedvalGrid_calc.getUnit(ingredientID);
            //row.Unit = unit;
        //});
        //data = JSON.stringify(rawData);
        minimize = 1;
//	console.log(data);
//	console.log(columnsToAppear);
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
                //alert('pppp');
                 solutionArray = data;
		//window.location.href = data.spreadsheetFilename;
            }
        });
        return solutionArray;
    	}



	
        //function calculatePredictedNutrientPrices() {
        //    var X, Y;
        //    X = feedvalGrid_calc.getNutrientCoefficientMatrix(selectedIngredientIDs);
        //    Y = actualFeedPriceMatrix;
        //    return (X.transpose().x(X)).inverse().x(X.transpose()).x(Y);
        //}

        function calculatePredictedNutrientPrices() {
              var X; //Y;
              //console.log("Selected ingredients: " + selectedIngredientIDs)
	      selectedIngredientIDs = selectedIngredientIDs.sort(function(a, b){return a-b})
	      //console.log("Selected ingredients: " + selectedIngredientIDs)
//	      console.log("Solution Vector: " + solutionVector)
              
	      X = feedvalGrid_calc.getNutrientCoefficientMatrix(selectedIngredientIDs);
              //Y = actualFeedPriceMatrix;
              NutrientMatrix = JSON.stringify(X.transpose());
              var selectedNutrients = feedvalGrid_calc.getSelectedNutrients();
	      var kg_DM = 0;
                $.each(selectedIngredientIDs, function (index, ingredientID){
                    var ind = $('table#grideval').find('tr#'+ingredientID).find('td').html(); 
                    var f1 = feedvalGrid_calc.getCell(ingredientID,'DM');
                    var f2 = solutionVector[ind-1];
                    var p = f1*f2;
                    if(!isNaN(p)){
//                        kg_DM = kg_DM + feedvalGrid_calc.getCell(ingredientID,'DM')*solutionVector[ingredientID-1];
                        kg_DM = kg_DM + p;
                    }
//                    console.log("Index: " + index + " ID: " + ingredientID + " DM: " + feedvalGrid_calc.getCell(ingredientID,'DM') + " Sol: " + solutionVector[ingredientID-1] + " Result: " + 
//                    feedvalGrid_calc.getCell(ingredientID,'DM')*solutionVector[ingredientID-1])
                });
//	      console.log(" kg_DM: " + kg_DM);
//              console.dir(selectedNutrients);

	      //console.log("Nutrient Matrix" + X.transpose().elements[0]) 
	      var percent_eff;
              var solutionNutrients = [];
	      var solutionNutrient = 0;
//              console.log("Solution Vector: " + solutionVector);
	      $.each(selectedNutrients, function (nutrient_index, nutrient){
//                  console.dir('acaaa');
                if((nutrient == 'NEl3x_Mcalkg') || (nutrient == 'Starch')){
                  percent_eff = 100*kg_DM;
                }else{
                    percent_eff = kg_DM;
                }
                solutionNutrient = 0;
                $.each(selectedIngredientIDs, function(index, ingredientID) {
//                    console.dir('a: ' + X.transpose().elements[nutrient_index][index]);
//                    console.dir('b: ' + feedvalGrid_calc.getCell(ingredientID,'DM'));
                    var ing = ingredientID-1;
                    var ind = $('table#grideval').find('tr#'+ingredientID).find('td').html(); 
//                    console.dir('id: '+ing);
//                    console.dir('c: ' + solutionVector[ingredientID-1]);
//                    if( dat_ing !== null && typeof(dat_ing) !== "undefined" ){
                    var c = solutionVector[ind-1];
                    if(c !== null && typeof(c) !== "undefined"){
                        solutionNutrient = solutionNutrient + X.transpose().elements[nutrient_index][index]*feedvalGrid_calc.getCell(ingredientID,'DM')*c*100;
                    }
                });
//                console.dir('nut:: '+solutionNutrient);
                solutionNutrient = solutionNutrient/percent_eff;
                solutionNutrients.push(solutionNutrient);
	      });

//	   console.log(solutionNutrients)

              return solutionNutrients;
          }

       function calculateSumSol() {
                //console.dir('acaaaaa');
                //console.dir(solutionVector);
                
		var sumSolVector = 0;
                var rawData = feedvalGrid_calc.grid.jqGrid('getRowData');
		//console.log(rawData);
		$.each(solutionVector, function (index, element) {
                    var ind = $('table#grideval').find('tr#'+(index+1)).find('td').html(); 
			 //console.log(index);
                         if(isNaN(element)) {
                           //console.dir("in NaN");
                           element = 0;
                         }
                         //console.dir(element);
			index = index + 1;
			//console.log(feedvalGrid_calc.getCell(ind+1, 'Selected'));
			 if(feedvalGrid_calc.getCell(index, 'Selected')=='YES') {
                             sumSolVector = sumSolVector + element;
			 }
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
            $('#eq_result').text(eqResult.toFixed(3) + ' $/cow.d');
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
            var nutrientCoefficientMatrix = feedvalGrid_calc.getNutrientCoefficientMatrix(selectedIngredientIDs);
            return feedvalGrid_calc.getPredictedFeedPriceMatrix(nutrientCoefficientMatrix, predictedNutrientPriceMatrix);
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
                    feedvalGrid_calc.setCell(ingredientID, 'Actual_Price', percentageDifference, {"background-color": color});
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
                    ingredientName: feedvalGrid_calc.getCell(ingredientID, 'Ingredient'),
                    ingredientID: ingredientID,
                    price: flattened[index],
                    fromUnit: 'Lb',
                    toUnit: feedvalGrid_calc.getUnit(ingredientID)
                };
            });
            feedvalGrid_calc.convertUnits(ingredients).done(function (converted) {
                $.each(allIngredientIDs, function (index, ingredientID) {
                    DM = feedvalGrid_calc.getCell(ingredientID, 'DM');
                    predictedFeedPrice = converted[ingredientID] * DM;
                    feedvalGrid_calc.setCell(ingredientID, 'Predicted_Value', predictedFeedPrice.toFixed(3) + '/' + ingredients[index].toUnit);
                });
            });
        }


        //FIXME:Change this function to accomodate Solution Vector
	function displaySolutionVector(solutionVector) {

            var DM, predictedFeedPrice, flattened, ingredients = [];
            //flattened = getFlattenedArray(predictedFeedPrices);
            
            $.each(allIngredientIDs, function (index, ingredientID) {
                ingredients[index] = {
                    ingredientName: feedvalGrid_calc.getCell(ingredientID, 'Ingredient'),
                    ingredientID: ingredientID,
                    price: solutionVector[index],
                    fromUnit: 'Lb', //FIXME: Adjunts unit
                    toUnit: feedvalGrid_calc.getUnit(ingredientID)
                };
            });
            
            
//            console.dir('kkkk5555')
//            console.dir(allIngredientIDs)
            //feedvalGrid_calc.convertUnits(ingredients).done(function (converted) {
                $.each(allIngredientIDs, function (index, ingredientID) {
                    
                    if(ingredientID=='separator' || ingredientID=='header2' || ingredientID=='41' || ingredientID=='42'){
                        return true;
                    }
                    
                    var dat_ing = parseFloat(solutionVector[index]);
                    if( dat_ing !== null && typeof(dat_ing) !== "undefined" ){
                        var color = getBackgroundColor(solutionVector[index]);
                        feedvalGrid_calc.setCell(ingredientID, 'Min_kgcowd', Number(solutionVector[index]).toFixed(3), {"background-color": color});
                    }
                });
                
           // }); 

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
                    ingredientName: feedvalGrid_calc.getCell(ingredientID, 'Ingredient'),
                    ingredientID: ingredientID,
                    price: flattened[index],
                    fromUnit: 'Lb',
                    toUnit: feedvalGrid_calc.getUnit(ingredientID)
                };
            });
	    
            feedvalGrid_calc.convertUnits(ingredients).done(function (converted) {
                $.each(allIngredientIDs, function (index, ingredientID) {
                    DM = feedvalGrid_calc.getCell(ingredientID, 'DM');
                    predictedFeedPrice = converted[ingredientID] * DM;
		    actualPrice = feedvalGrid_calc.getCell(ingredientID, 'Price_Unit');
		    $.each(nonSelectedIngredientIDs, function (indexNonSelected, ingredientIDNonSelected) {
		    if(ingredientID == ingredientIDNonSelected)
			{
			partOfNonSelected = 1;
		   	}	
		    });


		    if ((actualPrice != '') && !(isNaN(actualPrice)) && (partOfNonSelected==1))
                    {
		    diffPrice = actualPrice/predictedFeedPrice*100;
		    diffPrice = diffPrice.toFixed(0) 
		    //alert(actualPrice);
		    //alert(predictedFeedPrice);
		    //alert(diffPrice);
		    //feedvalGrid_calc.setCell(ingredientID, 'Predicted_Value', predictedFeedPrice.toFixed(3) + '/' + ingredients[index].toUnit);
         	    var color = getBackgroundColor(diffPrice);
		    feedvalGrid_calc.setCell(ingredientID, 'Actual_Price', diffPrice, {"background-color": color});
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

        function displayPredictedNutrientPrices(Horizontal_solution,valMax,rawData) {
            //valMax = 21
            if( max_value !== null && typeof(max_value) !== "undefined" && !isNaN(max_value)){
                valMax = max_value*100;
            }
            
            var prod = 0;
            var sumDM = 0;
            var sumAmountProvided = 0 ;
            var calcDM = 0;
            //console.log(rawData);
            $.each(rawData, function (index, ing){
                if(ing.Ingredient!='' && ing.Ingredient!='Ingredient' && ing.Ingredient!='Solution'){
                    //console.dir(ing);
                    //console.dir('-------------');
                    
                    //FIXME: Converting this price from ton price to kg price
                    //var pu = ing.Price_Unit;
                    // need to check if already in kg or not
                    //console.dir('----------------');
		    var unit = feedvalGrid_calc.getUnit(ing.ID);
		    //unit = $('tr#'+index+1).find('select.unit').val();
		    //console.log(unit);
		    //TODO: Need to add cwt too maybe?
                    if(unit == 'ton') {
                        var pu = ing.Price_Unit/907.185;
                    }else if(unit == 'cwt'){
                        var pu = ing.Price_Unit/50;
                    }else if(unit == 'lb'){
			var pu = ing.Price_Unit*2.20462;
		    }else {
                        var pu = ing.Price_Unit;
		    }
                    if(pu==''){
                        pu = 0;
                    }
		    console.log("unit = "+unit);
		    console.log("pu = "+pu);
                    var mk = ing.Min_kgcowd;//FIXME:changed from min_kgcowd to predicted value
                    //var mk = ing.Predicted_Value;
		    var val_unit;
                    if(mk==''){
                        mk = 0;
                    }else  if(feedvalGrid_calc.getCell('header2', 'Min_kgcowd').includes('lb')){
			mk = mk/2.20462;
		    }

		    
		    console.log("mk = "+mk);
		    console.log("-----------------");
		    
                    
                    if(ing.Selected=="YES"){
                        prod = parseFloat(prod) + parseFloat(pu)*parseFloat(mk);
                        console.log("prod "+ prod);
                        sumDM = 1*parseFloat(sumDM) + 1*parseFloat(ing.DM/100);
                        sumAmountProvided = 1*parseFloat(sumAmountProvided) + 1*parseFloat(ing.Min_kgcowd);
                        calcDM = 1*parseFloat(calcDM) + parseFloat(ing.DM/100)*parseFloat(solutionVector[index]);
                        //console.log(solutionVector[index]);
                        //console.log(ing.DM);console.log(calcDM);
                        //console.log("amount provided " + sumAmountProvided);
                    }
                    
                }
	    });
            valMax = calcDM; 
            var formattedPrices = {}, unit; //flattened, unit;
            
	    //console.log(Horizontal_solution); 
            //flattened = getFlattenedArray(predictedNutrientPrices);
            $.each(Horizontal_solution, function (index, price) {
            	if(selectedNutrients[index] == 'NEl3x_Mcalkg')
			unit='\n'+'Mcal/Kg';
		else 
			unit='\n'+'%DM'; 
		formattedPrices[selectedNutrients[index]] = price.toFixed(3)+unit;
	    });
//            console.dir();
            var kgasfed = calculateSumSol();
            console.dir(kgasfed);
//            var unitval = valMax/kgasfed;
            //FIXME: changed this to get right percentage
            var unitval = valMax/sumAmountProvided;
            //var unitval = sumDM/sumAmountProvided;
            
            console.dir(valMax);
            //console.dir('kkkkkkkkkkkkkkk');
            console.dir(sumAmountProvided);
            //console.dir(sumDM);

            //Extra In for horizontal solution
            formattedPrices['Ingredient'] = 'Solution:'; //Solution Word
            //formattedPrices['DM'] = sumDM.toFixed(3) + ' kg DM'; //Max
            //formattedPrices['DM'] = valMax.toFixed(3) + ' kg DM';
	    formattedPrices['DM'] = parseFloat(unitval*100).toFixed(3) + ' %DM';
	    //formattedPrices['Min_kgcowd'] = valMax.toFixed(3) + ' kg DM';
	    var asFedLabel;
	    var dmLabel;
	    if(feedvalGrid_calc.getCell('header2', 'Min_kgcowd').includes('kg')){
  	        asFedLabel = ' kg as fed';
		dmLabel = ' kg DM';
	    }else {
    		asFedLabel = ' lb as fed';
		dmLabel = ' lb DM';
	    }
	    formattedPrices['Min_kgcowd'] = parseFloat(Math.round(kgasfed * 100) / 100).toFixed(3) + asFedLabel; 
	    feedvalGrid_calc.setCell('data4', 'Min_kgcowd', valMax.toFixed(3) + dmLabel);

            //formattedPrices['Min_kgcowd'] = parseFloat(Math.round(kgasfed * 100) / 100).toFixed(3) + ' kg as fed';
    //        var tt = parseFloat(Math.round(kgasfed * 100) / 100).toFixed(3) + ' kg as fed';
    //        console.dir('tt:: ' + tt);
    //        formattedPrices['Price_Unit'] = solutionArray['2'].toFixed(3) + ' $/cow.d';
            //console.log("price unit unrounded: "+prod);
            formattedPrices['Price_Unit'] = parseFloat(Math.round(prod * 1000) / 1000).toFixed(3) + ' $/cow.d';
            //formattedPrices['Unit'] = parseFloat(100*Math.round(valMax * 100) / 100).toFixed(3) + ' %DM';
//            formattedPrices['Unit'] = parseFloat(100*Math.round(unitval * 100) / 100).toFixed(3) + ' %DM';
//            formattedPrices['Unit'] = parseFloat(sumAmountProvided).toFixed(3) + ' %DM';

	    // calculate DM Forage variables

	    var dm_forage = 0;
	    var ndf_forage = 0;
	    var all_forage = 0;
	    allIngredients = feedvalGrid_calc.getAllIngredientIDs();
	    $.each(allIngredientIDs, function(index, ingredientID) {
                var ind = $('table#grideval').find('tr#'+ingredientID).find('td').html(); 
		NDF = parseFloat(feedvalGrid_calc.getCell(ingredientID, 'NDF'));
	    	var cur_dm = parseFloat(feedvalGrid_calc.getCell(ingredientID, 'DM'));
		var sel = feedvalGrid_calc.getCell(ingredientID, 'Selected');
		if(ingredientID < 41){
			all_forage = all_forage + parseFloat(cur_dm*NDF*solutionVector[ind-1]);
		}
		if(ind < 7 && ind > 0 && sel=="YES") {
		    dm_forage = dm_forage + parseFloat(cur_dm*solutionVector[ind-1]);
		    ndf_forage = ndf_forage + parseFloat(cur_dm*NDF*solutionVector[ind-1]);
		    //console.log("cur_dm = " + cur_dm);
		    //console.log("NDF = " + NDF);
		    //console.log("ingredientID = " + ingredientID);
		    //console.log("amount provided = " + solutionVector[ingredientID-1]);
		    //console.log("dm_forage = " + dm_forage);
		    //console.log("ndf_forage = " + ndf_forage);
		}
	    });
	    var dm_total = parseFloat(feedvalGrid_calc.getCell('data4', 'Min_kgcowd'));
	    //console.log("total dm = "+dm_total);
	    //console.log("total forage dm = "+dm_forage);
	    var forage_DM = parseFloat((dm_forage/dm_total)*100).toFixed(3);
	    var NDF_forage = parseFloat(((dm_forage * (parseFloat(formattedPrices['NDF'])/100))/dm_total)*100).toFixed(3);
	    feedvalGrid_calc.grid.jqGrid('setRowData', 'data3', formattedPrices);
	    forage_DM = forage_DM + ' %DM from forage';
	    ndf_forage = ((ndf_forage/all_forage)*100).toFixed(3) + ' %DM NDF from forage';
	    feedvalGrid_calc.setCell('data4', 'DM', forage_DM);
	    feedvalGrid_calc.setCell('data5', 'DM', ndf_forage);
            //feedvalGrid_calc.grid.jqGrid('footerData', 'set', formattedPrices,false); //FIXME: Change this data according to minimization template
       }


        function removeNutrientsWithNegativePredictedPrices() {
            var nutrientsWithNegativePredictedPrices = getNutrientsWithNegativePredictedPrices();
            feedvalGrid_calc.grid.jqGrid('hideCol', nutrientsWithNegativePredictedPrices);
            feedvalGrid_calc.nutrientsSelectBox.multiselect('deselect', nutrientsWithNegativePredictedPrices)
        }

        function getNutrientsWithNegativePredictedPrices() {
            var flattenedArray = getFlattenedArray(predictedNutrientPriceMatrix.elements);
            return $.grep(selectedNutrients, function (nutrientName, index) {
                return flattenedArray[index] < 0;
            });
        }

        function needToRemoveNutrientsWithNegativePredictedPrices() {
            return feedvalGrid_calc.checkbox.is(':checked') && nutrientsWithNegativePredictedPricesExist();

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

    saveGrid: function () {
        feedvalGrid_calc.grid.jqGrid('editCell', 0, 0, false);
    },

    setCell: function (ingredientID, columnName, value, css) {
        css = css || {};
        feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, columnName, value, css);
    },

    AJAXError: function (jqXHR, textStatus, errorThrown) {
        feedvalGrid_calc.ajaxErrorModal.find('#response_text').html(jqXHR.responseText);
        feedvalGrid_calc.ajaxErrorModal.find('#text_status').html(textStatus);
        feedvalGrid_calc.ajaxErrorModal.find('#error_thrown').html(errorThrown);
        feedvalGrid_calc.ajaxErrorModal.modal('show');
    },
    afterEditCell: function (rowID, cellname, value, iRow, iCol) {
        //console.dir(rowID + ' '+cellname+' '+value+' ' +iRow + ' ' + iCol);
        if(rowID==='header2' || rowID==='header3' || rowID==='separator' || rowID==='data3' || rowID==='data4' || rowID==='data5'){
            var tmprow = rowID;
            gridSelector = $("#" + this.id);
            gridSelector.restoreCell(iRow, iCol);
            $('#grideval tr[id^="'+tmprow+'"]').removeClass('ui-state-hover');
            $('#grideval tr[id^="'+tmprow+'"]').find("td").eq(iCol).removeAttr('class');
        }
    },
    onSelectRow: function (ingredientID, status) {
        var selected;
        feedvalGrid_calc.clearResults();
        if (status) {
            selected = 'YES';
        } else {
            selected = 'NO';
        }
        feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Selected', selected);
    },

    onSelectAll: function () {
	var status = $('#cb_grideval').is(':checked');
	var selected;
	if (status) {
	    selected = "YES";
	} else {
	    select = "NO";
	}
	var allIngredients = feedvalGrid_calc.getAllIngredientIDs();
	$.each(allIngredients, function(index, ingredientID) {
	    if(ingredientID <= 40) {
		feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Selected', selected);
	    }
	});
        feedvalGrid_calc.clearResults();
    },


    afterSaveCell: function () {
        feedvalGrid_calc.clearResults();
    },

    createGrid: function (data) {
        var jqGridOptions;
//        console.dir("acaaaa");
//        console.dir(data);
        feedvalGrid_calc.nutrients = data.nutrients;
        jqGridOptions = data.jqGridOptions;

        jqGridOptions.loadComplete = feedvalGrid_calc.loadComplete;
        jqGridOptions.onSelectRow = feedvalGrid_calc.onSelectRow;
        jqGridOptions.afterEditCell = feedvalGrid_calc.afterEditCell;
        jqGridOptions.onSelectAll = feedvalGrid_calc.onSelectAll;
        jqGridOptions.afterSaveCell = feedvalGrid_calc.afterSaveCell;

        feedvalGrid_calc.grid = $('#grideval');
        feedvalGrid_calc.grid.jqGrid(jqGridOptions);
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
        $.each(feedvalGrid_calc.nutrients, function (xmlMap, nutrient) {
            feedvalGrid_calc.nutrientsSelectBox.append('<option value="' + xmlMap + '">' + nutrient + '</option>')
        });
        var selectedNutrients = feedvalGrid_calc.getSelectedNutrients();
        this.nutrientsSelectBox.multiselect({
            numberDisplayed: 0,
            onChange: function (element, checked) {
                var hideOrShow = checked ? 'showCol' : 'hideCol';
                feedvalGrid_calc.grid.jqGrid(hideOrShow, element.val());
                feedvalGrid_calc.clearResults();
            }
        });
        this.nutrientsSelectBox.multiselect('rebuild');
        this.nutrientsSelectBox.multiselect('select', selectedNutrients);
    },

    getAsFedFromOptimizer: function () {
        feedvalGrid_calc.clearResults();
        var arrMin0;
        opt_results = feedvalGrid.grid.jqGrid('getRowData');
        var new_solution = [];
        feedvalGrid_calc.selectIngredientsWithPrices();
        $.each(opt_results, function (rowIndex, row) {
            ingredientID = row.ID;
            if(ingredientID=='header2'){
                return false;
            }
             
            if(row.Predicted_Value=='') {
                //console.dir("in NaN with ingredient: " + ingredientID + " and predicted vale of " + row.Predicted_Value);
                new_solution.push(parseFloat(0));
            } else {
                new_solution.push(parseFloat(row.Predicted_Value));
            }
        });
        arrMin0 = new_solution;
        //console.dir(arrMin0);
 
        allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
        $.each(allIngredientIDs, function (index, ingredientID){
            var dato = arrMin0[index];
            if(ingredientID=='header2'){
                return false;
            }
            if( dato !== null && typeof(dato) !== "undefined" ){
                var color = getBackgroundColor(dato);
                feedvalGrid_calc.setCell(ingredientID, 'Min_kgcowd', dato, {"background-color": color});
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
        

    },

    loadComplete: function () {
        feedvalGrid_calc.groupHeaders();
        feedvalGrid_calc.selectIngredientsWithPrices();
        //feedvalGrid_calc.checkConversion();
        //feedvalGrid_calc.createNutrientSelectMenu();
        (function () {
            var fromUnit;
            $('.input_column select').focus(function (eventObject) {
                fromUnit = $(eventObject.target).val();
            }).change(function (eventObject) {
                var tr, ingredientID, ingredientName, price, select, toUnit;
		feedvalGrid_calc.clearResults();
                select = $(eventObject.target);
                toUnit = select.val();
                tr = select.parents('tr').get(0);
                ingredientID = $(tr).attr('id');
                var pricePerUnitColumnIndex = feedvalGrid_calc.getColumnIndex('Price_Unit');
                feedvalGrid_calc.grid.jqGrid('saveCell', ingredientID, pricePerUnitColumnIndex);
                ingredientName = feedvalGrid_calc.getCell(ingredientID, 'Ingredient');
                price = feedvalGrid_calc.getCell(ingredientID, 'Price_Unit');

                if (price != '') {
                    feedvalGrid_calc.convertUnits({
                        ingredientName: ingredientName,
                        ingredientID: ingredientID,
                        price: price,
                        fromUnit: fromUnit,
                        toUnit: toUnit
                    }).done(function (converted) {
                        var priceInConvertedUnit = converted[ingredientID];
                        feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceInConvertedUnit.toFixed(2));
                        select.blur();
                    });
                }
            });
        })();

            max_value = feedvalGrid_calc.getCell('42', 'DM');
            //delete
            //feedvalGrid_calc.grid.jqGrid('delRowData','41');
            //feedvalGrid_calc.grid.jqGrid('delRowData','42');
            feedvalGrid_calc.grid.jqGrid('delRowData','header3');

            
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
                'Amount Provided lb/cow.d',
                'Max lb/cow.d',
                'Unit',
                'Price* $/Unit',
                'Solution lb/cow.d'
            ];
            var arr_h3 = [
                'Solution',
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

            $('#jqgh_grideval_Min_kgcowd').text("Amount Provided lb/cow.d");
 
            $('#grideval tr[id^="header2"]').find("td").each(function( index ){
                if(index>1 ){
                    var ni = parseInt(1*index-4);
                    if(arr_h2[ni]){
                        var tmp = ''+arr_h2[ni]+'';
                        $(this).html(tmp);
                    }
                }
            });
            $('#grideval tr[id^="header3"]').find("td").each(function( index ){
                if(index>1 && 0){
                    var ni = parseInt(1*index-4);
                    if(arr_h3[ni]){
                        var tmp = ''+arr_h3[ni]+'';
                        $(this).html(tmp);
                    }
                }
            });
             //recorrer class sepp
            $('#grideval tr[id^="separator"]').find("td").eq(0).html('');
            $('#grideval tr[id^="separator"]').find("td").eq(1).html('');
            
            $('#grideval tr[id^="header2"]').find("td").eq(0).html('');
            $('#grideval tr[id^="header2"]').find("td").eq(1).html('');
            
            $('#grideval tr[id^="header3"]').find("td").eq(0).html('');
            $('#grideval tr[id^="header3"]').find("td").eq(1).html('');
            
            $('#grideval tr[id^="41"]').find("td").eq(0).html('');
            $('#grideval tr[id^="41"]').find("td").eq(1).html('');
            $('#grideval tr[id^="41"]').find("td").eq(4).html('');
            
            $('#grideval tr[id^="42"]').find("td").eq(0).html('');
            $('#grideval tr[id^="42"]').find("td").eq(1).html('');
            $('#grideval tr[id^="42"]').find("td").eq(4).html('');
           
	    $('#grideval tr[id^="data3"]').find("td").eq(0).html('');
	    $('#grideval tr[id^="data3"]').find("td").eq(1).html('');
	    $('#grideval tr[id^="data3"]').removeClass('jqgrow');
	    $('#grideval tr[id^="data3"]').removeClass('ui-row-ltr');
	    $('#grideval tr[id^="data3"]').addClass("footrow");
	    $('#grideval tr[id^="data3"]').addClass("footrow-ltr");
	            
	    $('#grideval tr[id^="data4"]').find("td").eq(0).html('');
	    $('#grideval tr[id^="data4"]').find("td").eq(1).html('');
	    $('#grideval tr[id^="data4"]').removeClass('jqgrow');
	    $('#grideval tr[id^="data4"]').removeClass('ui-row-ltr');
	    $('#grideval tr[id^="data4"]').addClass("footrow");
	    $('#grideval tr[id^="data4"]').addClass("footrow-ltr");
	          
	    $('#grideval tr[id^="data5"]').find("td").eq(0).html('');
	    $('#grideval tr[id^="data5"]').find("td").eq(1).html('');
	    $('#grideval tr[id^="data5"]').removeClass('jqgrow');
	    $('#grideval tr[id^="data5"]').removeClass('ui-row-ltr');
	    $('#grideval tr[id^="data5"]').addClass("footrow");
	    $('#grideval tr[id^="data5"]').addClass("footrow-ltr");
	    
 
            $('#grideval tr[id^="header2"]').addClass('footrow footrow-ltr');
            
        feedvalGrid_calc.checkConversion();
        // getting results from optimizer into feedvalGrid_calc
        var arrMin0 = [3.4769, 0, 0, 0, 0, 0, 0, 2.3, 18, 0, 2.1623, 0, 0.0825, 0, 0.1, 1.5, 0.8249, 1.22, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1.6404, 0, 0.3789, 0];
        opt_results = feedvalGrid.grid.jqGrid('getRowData');
        var new_solution = [];
        $.each(opt_results, function (rowIndex, row) {
            ingredientID = row.ID;
            if(ingredientID=='header2'){
                return false;
            }
             
            if(row.Predicted_Value=='') {
                //console.dir("in NaN with ingredient: " + ingredientID + " and predicted vale of " + row.Predicted_Value);
                new_solution.push(parseFloat(0));
            } else {
                new_solution.push(parseFloat(row.Predicted_Value));
            }
        });
        arrMin0 = new_solution;
        //console.dir(arrMin0);
             
 	    
        //     feedvalGrid_calc.grid.jqGrid('setCell', 37, 'Ingredient', 'Barley');
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'NEl3x_Mcalkg', 0.85);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'CP', 12.4);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'NDF', 20.8);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'RUP', 3.4);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'RDP', 9);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'Lipid', 2.2);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'peNDF', 0);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'Ca', 0.06);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'Phos', 0.39);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'Starch', 60);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'DM', 89);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 37, 'Price_Unit', 10);
        //     feedvalGrid_calc.grid.jqGrid('setCell', 35, 'Ingredient', 'Alfalfa Silage');
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'NEl3x_Mcalkg', 1.32);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'CP', 20);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'NDF', 40);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'RUP', 4);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'RDP', 16);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'Lipid', 2);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'peNDF', 32);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'Ca', 1.3);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'Phos', 0.3);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'Starch', 2.5);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'DM', 40);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 35, 'Price_Unit', 63.5);
        //     feedvalGrid_calc.grid.jqGrid('setCell', 36, 'Ingredient', 'Grass Silage');
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'NEl3x_Mcalkg', 1.21);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'CP', 16);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'NDF', 51);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'RUP', 4);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'RDP', 12);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'Lipid', 2);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'peNDF', 45);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'Ca', 0.6);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'Phos', 0.3);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'Starch', 2.5);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'DM', 40);
	    // feedvalGrid_calc.grid.jqGrid('setCell', 36, 'Price_Unit', 47.6);

            $('table#grideval').find('tr#1').find('select.unit').append($('<option>', {
			value: 'bu',
			text: 'bu', 
			selected: 'selected'
		}));
	    feedvalGrid_calc.grid.jqGrid('setCell', 1, 'Price_Unit', 3.92);
	    var rows = [35, 36, 7, 8, 9, 16]
            
	    for(var i=1; i<=rows.length; i++) {
          /*      var tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'Ingredient');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'Ingredient', feedvalGrid_calc.grid.jqGrid('getCell', i, 'Ingredient'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'Ingredient', tmp);

		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'NEl3x_Mcalkg');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'NEl3x_Mcalkg', feedvalGrid_calc.grid.jqGrid('getCell', i, 'NEl3x_Mcalkg'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'NEl3x_Mcalkg', tmp);
	
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'CP');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'CP', feedvalGrid_calc.grid.jqGrid('getCell', i, 'CP'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'CP', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'NDF');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'NDF', feedvalGrid_calc.grid.jqGrid('getCell', i, 'NDF'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'NDF', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'RUP');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'RUP', feedvalGrid_calc.grid.jqGrid('getCell', i, 'RUP'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'RUP', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'RDP');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'RDP', feedvalGrid_calc.grid.jqGrid('getCell', i, 'RDP'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'RDP', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'Lipid');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'Lipid', feedvalGrid_calc.grid.jqGrid('getCell', i, 'Lipid'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'Lipid', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'peNDF');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'peNDF', feedvalGrid_calc.grid.jqGrid('getCell', i, 'peNDF'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'peNDF', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'Ca');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'Ca', feedvalGrid_calc.grid.jqGrid('getCell', i, 'Ca'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'Ca', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'Phos');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'Phos', feedvalGrid_calc.grid.jqGrid('getCell', i, 'Phos'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'Phos', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'Starch');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'Starch', feedvalGrid_calc.grid.jqGrid('getCell', i, 'Starch'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'Starch', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'DM');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'DM', feedvalGrid_calc.grid.jqGrid('getCell', i, 'DM'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'DM', tmp);
	        
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'Price_Unit');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'Price_Unit', feedvalGrid_calc.grid.jqGrid('getCell', i, 'Price_Unit'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'Price_Unit', tmp);
                   
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'Max_kgcowd');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'Max_kgcowd', feedvalGrid_calc.grid.jqGrid('getCell', i, 'Max_kgcowd'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'Max_kgcowd', tmp);
               
		tmp = feedvalGrid_calc.grid.jqGrid('getCell', rows[i-1], 'Min_kgcowd');
                feedvalGrid_calc.grid.jqGrid('setCell', rows[i-1], 'Min_kgcowd', feedvalGrid_calc.grid.jqGrid('getCell', i, 'Min_kgcowd'));
		feedvalGrid_calc.grid.jqGrid('setCell', i, 'Min_kgcowd', tmp);
	*/	
                $('#grideval tr[id="'+rows[i-1]+'"]').removeClass('ui-state-highlight');
		$('#grideval tr[id="'+rows[i-1]+'"]').addClass('ui-state-highlight-forage');
            }
	    

	feedvalGrid_calc.getMinMaxData();
        rawData = feedvalGrid_calc.grid.jqGrid('getRowData');
        //console.log(rawData);
	var NDF;
	var peNDF;
	var ingredientName;
        allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
        $.each(allIngredientIDs, function (index, ingredientID){
	    NDF = feedvalGrid_calc.getCell(ingredientID, 'NDF');
	    peNDF = feedvalGrid_calc.getCell(ingredientID, 'peNDF');
	    if (NDF > 0) {
                if (peNDF <=0) {
		    peNDF = 0.25*parseFloat(NDF)*100;
		    feedvalGrid_calc.setCell(ingredientID, 'peNDF', peNDF.toFixed(2));
		}
	    }
	    ingredientName = feedvalGrid_calc.getCell(ingredientID, 'Ingredient');
	    if(ingredientName == 'Tallow' || ingredientName == 'Barley'){
		$('tr#' + ingredientID).find('select.unit').val('cwt');
	    }

            var dato = arrMin0[index];
            if(ingredientID=='header2'){
                return false;
            }
            if( dato !== null && typeof(dato) !== "undefined" ){
//                console.dir('pppp7777');
//                console.dir(dato);
                var color = getBackgroundColor(dato);
                feedvalGrid_calc.setCell(ingredientID, 'Min_kgcowd', dato, {"background-color": color});
            }
            
           
        });
	feedvalGrid_calc.setCell(1, 'Price_Unit', parseFloat(feedvalGrid.getCell(1, 'Price_Unit')));
	feedvalGrid_calc.setCell(2, 'Price_Unit', parseFloat(feedvalGrid.getCell(2, 'Price_Unit')));
        $('table#grideval').find('tr#' + 37).find('select.unit').val('cwt');
        
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
        
//        $.each(allIngredientIDs, function (index, ingredientID){
//                    
//            if(ingredientID=='separator' || ingredientID=='header2'){
//                return true;
//            }
//
//            var dat_ing = parseFloat(solutionVector[index]);
//            if( dat_ing !== null && typeof(dat_ing) !== "undefined" ){
//                var color = getBackgroundColor(solutionVector[index]);
//                feedvalGrid_calc.setCell(ingredientID, 'Min_kgcowd', Number(solutionVector[index]).toFixed(3), {"background-color": color});
//            }
//        });
         // go through optimizer units and make the same
           /*var optIngredientIDs = feedvalGrid.getAllIngredientIDs();
           var all = false;
           $.each(optIngredientIDs, function (index, ingredientID){
            var dato = arrMin0[index];
            if(feedvalGrid.getUnit(ingredientID) == 'kg') {
                feedvalGrid_calc.convertToKg();
                break;
            }
           });*/
        
    },

    getColumnIndex: function (columnName) {
        var colModel = feedvalGrid_calc.grid.jqGrid('getGridParam', 'colModel');
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
        feedvalGrid_calc.grid.jqGrid('resetSelection');
        allIngredients = feedvalGrid_calc.getAllIngredientIDs();
        $.each(allIngredients, function (index, ingredientID) {
            price = feedvalGrid_calc.getCell(ingredientID, 'Price_Unit');
            var nonSelectedIngredients = feedvalGrid.getNonSelectedIngredientIDs();
            if(!(nonSelectedIngredients.indexOf(ingredientID) >= 0)){
            if ($.trim(price) != '') {
                feedvalGrid_calc.grid.jqGrid('setSelection', ingredientID, false);
            } else if (ingredientID == 15) {
                feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Price_Unit', 0.24/*472*/); //Hardcoding price of Urea FIXME: find better place to do this
                feedvalGrid_calc.grid.jqGrid('setSelection', ingredientID, false);
            }
            }
        });
    },

    groupHeaders: function () {
        var colModel, firstNutrientName, numberOfNutrients;
        colModel = this.grid.jqGrid('getGridParam', 'colModel');
        firstNutrientName = colModel[5].name;
        numberOfNutrients = feedvalGrid_calc.getNumberOfNutrients();
        this.grid.jqGrid('setGroupHeaders', {
            useColSpanStyle: true,
            groupHeaders: [
                {startColumnName: firstNutrientName, numberOfColumns: numberOfNutrients, titleText: 'Nutrients'},
                {startColumnName: 'DM', numberOfColumns: 3, titleText: 'As-Fed Basis'},
                {startColumnName: 'Price_Unit', numberOfColumns: 2, titleText: 'As-Fed Basis'}
            ]
        });
    },

    downloadAsExcelSpreadsheet: function () {
        
        var columnsToAppear, data, ingredientID, unit, rawData;
        columnsToAppear = JSON.stringify(this.getWhitelistedColumns());
        rawData = this.grid.jqGrid('getRowData');
        $.each(rawData, function (rowIndex, row) {
            ingredientID = row.ID;
            unit = feedvalGrid_calc.getUnit(ingredientID);
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

    getWhitelistedColumns: function () {
        var whitelistedColumns = [], colModel;
        colModel = this.grid.jqGrid('getGridParam', 'colModel');
        $.each(colModel, function (index, col) {
            
//            console.dir('oolcol');
//            console.dir(col);
            if (col.label && (col.hidden == false || $.inArray(col.name, feedvalGrid_calc.requiredColumns) >= 0)) {
                var tmpcol = col.name;
                if(col.name=='Min_kgcowd'){
                    //tmpcol = col.name+'-amountprovided';
                }
                whitelistedColumns.push(tmpcol);
            }
        });
        //console.dir(whitelistedColumns);

        return whitelistedColumns;
    },

    createDatePicker: function () {
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
                }).datepicker('setDate', result.maxDate).on('changeDate', function (e) {
                   feedvalGrid_calc.updatePrices(e.date);
                });
            }
        });
    },

    convertValsToLb: function () {
            var allIngredientIDs, ingredients = [], price;
            feedvalGrid_calc.clearResults();
            allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
            $.each(allIngredientIDs, function (index, ingredientID) {
		var cur_max = feedvalGrid_calc.grid.jqGrid('getCell', 'header2', 'Min_kgcowd');
		max = feedvalGrid_calc.getCell(ingredientID, 'Min_kgcowd');
		if(max && ingredientID<41 && cur_max.includes('kg')) {
			max = parseFloat(max)*2.20462;
			feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Min_kgcowd', max.toFixed(2));
		}
            });
	    $('div#jqgh_grideval_Min_kgcowd').text('Amount Provided lb/cow.d');
	    feedvalGrid_calc.setCell('header2', 'Min_kgcowd', 'Amount Provided lb/cow.d');
	    feedvalGrid_calc.grid.jqGrid('setCell', 41, 'DM', 50.71);
	    feedvalGrid_calc.grid.jqGrid('setCell', 42, 'DM', 50.71);
	    feedvalGrid_calc.grid.jqGrid('setCell', 'header3', 'DM', 'lb DM');
    },

    convertValsToKg: function () {
            var allIngredientIDs, ingredients = [], price;
            feedvalGrid_calc.clearResults();
            allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
            $.each(allIngredientIDs, function (index, ingredientID) {
		var cur_max = feedvalGrid_calc.grid.jqGrid('getCell', 'header2', 'Min_kgcowd');
		max = feedvalGrid_calc.getCell(ingredientID, 'Min_kgcowd');
		if(max && ingredientID<41 && cur_max.includes('lb')) {
			max = parseFloat(max)/2.20462;
			feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Min_kgcowd', max.toFixed(2));
		}
            });
	    $('div#jqgh_grideval_Min_kgcowd').text('Amount Provided kg/cow.d');
	    feedvalGrid_calc.setCell('header2', 'Min_kgcowd', 'Amount Provided kg/cow.d');
	    feedvalGrid_calc.grid.jqGrid('setCell', 41, 'DM', 23);
	    feedvalGrid_calc.grid.jqGrid('setCell', 42, 'DM', 23);
	    feedvalGrid_calc.grid.jqGrid('setCell', 'header3', 'DM', 'kg DM');
    },

    convertToLb: function () {
            var allIngredientIDs, ingredients = [], price;
            feedvalGrid_calc.clearResults();
            allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
            $.each(allIngredientIDs, function (index, ingredientID) {
                price = feedvalGrid_calc.getCell(ingredientID, 'Price_Unit');
                if (price) {
                    ingredients.push({
                        ingredientName: feedvalGrid_calc.getCell(ingredientID, 'Ingredient'),
                        ingredientID: ingredientID,
                        price: price,
                        fromUnit: feedvalGrid_calc.getUnit(ingredientID),
                        toUnit: 'lb'
                    });
                }
            });
	    console.log(ingredients);
            feedvalGrid.convertUnits(ingredients).done(function (pricesInKG) {
                var priceInKG;
                $.each(allIngredientIDs, function (index, ingredientID) {
                    $('tr#' + ingredientID).find('select.unit').val('lb');
                    $('table#grideval').find('tr#' + ingredientID).find('select.unit').val('lb');
                    if (pricesInKG[ingredientID])  
		    {
                        priceInKG = parseFloat(pricesInKG[ingredientID]);
			feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceInKG.toFixed(3));
                    }
                });
            });
    },
    convertToKg: function () {
            var allIngredientIDs, ingredients = [], price;
            feedvalGrid_calc.clearResults();
            allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
            $.each(allIngredientIDs, function (index, ingredientID) {
                price = feedvalGrid_calc.getCell(ingredientID, 'Price_Unit');
                if (price) {
                    ingredients.push({
                        ingredientName: feedvalGrid_calc.getCell(ingredientID, 'Ingredient'),
                        ingredientID: ingredientID,
                        price: price,
                        fromUnit: feedvalGrid_calc.getUnit(ingredientID),
                        toUnit: 'kg'
                    });
                }
            });
            feedvalGrid_calc.convertUnits(ingredients).done(function (pricesInKG) {
                var priceInKG;
                $.each(allIngredientIDs, function (index, ingredientID) {
                    $('tr#' + ingredientID).find('select.unit').val('kg');
                    $('table#grideval').find('tr#' + ingredientID).find('select.unit').val('kg');
                    if (pricesInKG[ingredientID])  
		    {
                        priceInKG = parseFloat(pricesInKG[ingredientID]);
			feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceInKG.toFixed(3));
                    }
                });
            });
    },
   
    getMinMaxData: function () {
	var min_data = feedvalGrid.grid.jqGrid('getRowData', 41);
	var max_data = feedvalGrid.grid.jqGrid('getRowData', 42);
	feedvalGrid_calc.grid.jqGrid('setRowData', 41, min_data);
	feedvalGrid_calc.grid.jqGrid('setRowData', 42, max_data);
	//console.log(min_data);
	//console.log(max_data);
    },
 
    convertToLbFirst: function () {
            var allIngredientIDs, ingredients = [], price;
            feedvalGrid_calc.clearResults();
            allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
                var priceInKG;
                $.each(allIngredientIDs, function (index, ingredientID) {
                    $('table#grideval').find('tr#' + ingredientID).find('select.unit').val('lb');
                    if (feedvalGrid.getCell(ingredientID, 'Price_Unit'))
		    {
                        priceInKG = parseFloat(feedvalGrid.getCell(ingredientID, 'Price_Unit'));
			feedvalGrid_calc.setCell(ingredientID, 'Price_Unit', priceInKG.toFixed(3));
                    }
                });
		feedvalGrid_calc.setCell(1, 'Price_Unit', parseFloat(feedvalGrid.getCell(1, 'Price_Unit')));
    },
    convertToKgFirst: function () {
            var allIngredientIDs, ingredients = [], price;
            feedvalGrid_calc.clearResults();
            allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
                var priceInKG;
                $.each(allIngredientIDs, function (index, ingredientID) {
                    $('table#grideval').find('tr#' + ingredientID).find('select.unit').val('kg');
                    if (feedvalGrid.getCell(ingredientID, 'Price_Unit'))
		    {
                        priceInKG = parseFloat(feedvalGrid.getCell(ingredientID, 'Price_Unit'));
			feedvalGrid_calc.setCell(ingredientID, 'Price_Unit', priceInKG.toFixed(3));
                    }
                });
		feedvalGrid_calc.setCell(1, 'Price_Unit', parseFloat(feedvalGrid.getCell(1, 'Price_Unit')));
    },

    checkConversion: function() {
            var convert = false;
	    for(var i=1; i<41; i++){
	       //console.log("--------- Optimizer Unit ---------");
	       //console.log(feedvalGrid.getUnit(i));
               //console.log(feedvalGrid.getCell(i, 'Ingredient'));
	       //console.log("----------------------------------");
	       if(feedvalGrid.getUnit(i)=='kg'){
		   convert = true;
	       }else {
		   convert = false;
		   break;
	       }
	    }
	    //alert(convert);
	    if(convert){
		feedvalGrid_calc.convertToKgFirst();
	    }
	    convert = false;
	    for(var i=1; i<41; i++){
	       //console.log("--------- Optimizer Unit ---------");
	       //console.log(feedvalGrid.getUnit(i));
               //console.log(feedvalGrid.getCell(i, 'Ingredient'));
	       //console.log("----------------------------------");
	       if(feedvalGrid.getUnit(i)=='lb'){
		   convert = true;
	       }else {
		   convert = false;
		   break;
	       }
	    }
	    //alert(convert);
	    if(convert){
		feedvalGrid_calc.convertToLbFirst();
	    }

	    if($('#jqgh_grid_Max_kgcowd').text().includes('kg')){
                $('table#grideval').find('tr#header2').find('td#Min_kgcowd').text('Amount Provided kg/cow.d');
	    	$('div#jqgh_grideval_Min_kgcowd').text('Amount Provided kg/cow.d');
	    	feedvalGrid_calc.grid.jqGrid('setCell', 'header2', 'Min_kgcowd', 'Amount Provided kg/cow.d');
	    	feedvalGrid_calc.grid.jqGrid('setCell', 41, 'DM', 23);
	    	feedvalGrid_calc.grid.jqGrid('setCell', 42, 'DM', 23);
	    }
    },

    updatePrices: function (date) {
        var columnsToClear, select, unit, ingredientName, price;
	var allIngredientIDs = feedvalGrid_calc.getAllIngredientIDs();
	$.ajax({
            data: {
                pricesForDate: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
            },
            type: 'GET',
            dataType: 'json',
            success: function (prices) {
		columnsToClear = ['Price_Unit'];
                feedvalGrid_calc.clearColumns(columnsToClear);

                $.each(prices, $.proxy(function (ingredientID, priceAndUnit) {
                    feedvalGrid_calc.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceAndUnit['price']);
                    select = feedvalGrid_calc.getCell(ingredientID, 'Unit');
                    //console.log("selected unit"); console.log(select);
                    $(select).val(priceAndUnit['unit']);
	        }, this));

		$.each(allIngredientIDs, function (index, ingredientID) {
		
		      unit = feedvalGrid_calc.getUnit(ingredientID);
                      price = feedvalGrid_calc.getCell(ingredientID, 'Price_Unit');
                      ingredientName = feedvalGrid_calc.getCell(ingredientID, 'Ingredient'); 
		      if(unit == 'kg' || price =='') 
			{
				$('tr#' + ingredientID).find('select.unit').val('ton');
		        
			}
		      if(ingredientName == 'Tallow' || ingredientName == 'Barley')
				$('tr#' + ingredientID).find('select.unit').val('cwt');

		});
                feedvalGrid_calc.selectIngredientsWithPrices();
                feedvalGrid_calc.clearResults();
            }
        })
    


//console.log(feedvalGrid_calc.getSelectedIngredientIDs());
	
}


}; // End of feedvalGrid_calc.


//$(document).ready(function () {
    
    function initCalc(){
        
    // Default AJAX settings.
    $.ajaxSetup({
        // We use the same URL for all AJAX calls.
        url: 'ajax.php?tip=eval',
        // A default error handler.
        error: feedvalGrid_calc.AJAXError,
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
    feedvalGrid_calc.createModals();
    //feedvalGrid_calc.createDatePicker();
    bindElements();

    // Get the settings required for the grid and create it.
    $.ajax({
        dataType: 'json',
        type: 'POST',
        success: feedvalGrid_calc.createGrid
    });

    // check if Optimizer had already converted to Kg's, if so call convert
    // marker

    // Upload excel spreadsheet
    $('#upload_form_calculate').ajaxForm({
        dataType: 'json',
        type: 'POST',
        beforeSubmit: function () {
            var selectedFile = $('input[name=data_file_calc]').val();
            if (selectedFile == '') {
                alert('Please select a file to upload. Evaluator');
                return false;
            }
            return true;
        },
        success: function (data) {
            feedvalGrid_calc.grid.jqGrid('GridUnload', '#grideval');
            feedvalGrid_calc.createGrid(data);
        }
    });
    
    
    function bindElements() {
        $('#calculate').bind('click', function () {
            var analyzingMessage = $('#analyzing');
            analyzingMessage.show();
            //FIXME:Check Improve calculateMinimization
            //feedvalGrid_calc.calculateMinimization();
            feedvalGrid_calc.analyze();
            analyzingMessage.hide();
        });

	$('#calculate-footer').bind('click', function () {
            var analyzingMessage = $('#analyzing');
            analyzingMessage.show();
            //FIXME:Check Improve calculateMinimization
            //feedvalGrid_calc.calculateMinimization();
            feedvalGrid_calc.analyze();
            analyzingMessage.hide();
        });


        $('.calculate-download').off().bind('click', function () {
            feedvalGrid_calc.downloadAsExcelSpreadsheet();
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

        feedvalGrid_calc.checkbox = $('input[name="remove_negative_price_nutrients"]');
        feedvalGrid_calc.checkbox.change(function () {
            feedvalGrid_calc.clearResults();
        });

        $('#data_file').change(function () {
            feedvalGrid_calc.clearResults();
        });

        $('#convert-to-kgscalc').bind('click', function () {
		if($('#convert-to-kgscalc').text().includes('kg')){
			$('#convert-to-kgscalc').text('Convert amounts to lb');
			$('#convert-to-kgs').text('Convert amounts to lb');
			feedvalGrid_calc.convertValsToKg();
			feedvalGrid.convertValsToKg();
		}else{
			$('#convert-to-kgscalc').text('Convert amounts to kg');
			$('#convert-to-kgs').text('Convert amounts to kg');
			feedvalGrid_calc.convertValsToLb();
			feedvalGrid.convertValsToLb();
		}
        });

	$('#convert-prices-to-kgscalc').bind('click', function () {
		if($('#convert-prices-to-kgscalc').text().includes('kg')){
			$('#convert-prices-to-kgscalc').text('Convert prices to lb');
			$('#convert-prices-to-kgs').text('Convert prices to lb');
			feedvalGrid_calc.convertToKg();
			feedvalGrid.convertToKg();
		}else{
			$('#convert-prices-to-kgscalc').text('Convert prices to kg');
			$('#convert-prices-to-kgs').text('Convert prices to kg');
			feedvalGrid_calc.convertToLb();
			feedvalGrid.convertToLb();
		}
	});
    }


}
