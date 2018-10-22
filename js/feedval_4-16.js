/**
 * The FeedVal 2012 grid.
 */
var feedvalGrid = {
    grid: {},
    nutrients: null,
    requiredColumns: ['Selected', 'DM', 'Price_Unit', 'Unit', 'Predicted_Value', 'Actual_Price'],
    invalidSelectionModal: null,
    ajaxErrorModal: null,
    nutrientsSelectBox: null,
    checkbox: null,

    getNumberOfNutrients: function () {
        return $.map(feedvalGrid.nutrients, function (element) {
            return element;
        }).length;
    },

    convertUnits: function (ing) {
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
            dataType: 'json'
        });
    },

    selectionValid: function () {
        return (!this.getSelectedNutrientsNotPresentInAnySelectedFeed().length && !(this.getNumberIngredientsBiggerThanNumberNutrients()<0));
    },

    onlyRupRdpSelected: function () {
        var selectedNutrients;
        selectedNutrients = feedvalGrid.getSelectedNutrients();
        return selectedNutrients.length == 2 &&
            $.grep(selectedNutrients, function (nutrient) {
                return nutrient.indexOf('RUP') >= 0 ||
                    nutrient.indexOf('RDP') >= 0;
            }).length == 2;
    },

    getSelectedNutrientsNotPresentInAnySelectedFeed: function () {
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

    getNumberIngredientsBiggerThanNumberNutrients: function() {

	var selectedIngredientIDs, selectedNutrients, differenceSelIngredientsSelNutrients;
	selectedNutrients = feedvalGrid.getSelectedNutrients();
	selectedIngredientIDs = feedvalGrid.getSelectedIngredientIDs(); 
	differenceSelIngredientsSelNutrients = selectedIngredientIDs.length - selectedNutrients.length;

	return differenceSelIngredientsSelNutrients;

    },  



    cpSelectedWithRupOrRdp: function () {
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
                ingredientName: feedvalGrid.getCell(ingredientID, 'Ingredient'),
                ingredientID: ingredientID,
                price: feedvalGrid.getCell(ingredientID, 'Price_Unit'),
                fromUnit: feedvalGrid.getUnit(ingredientID),
                toUnit: 'Lb'
            };
        });
	
	return feedvalGrid.convertUnits(ingredients);
    },

    getUnit: function (ingredientID) {
        return $('tr#' + ingredientID).find('select.unit').val();
    },

    getCell: function (ingredientID, columnName) {
        var cellValue, colLabel;
        cellValue = feedvalGrid.grid.jqGrid('getCell', ingredientID, columnName);
        colLabel = feedvalGrid.grid.jqGrid('getColProp', columnName).label;
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
	    $.each(feedvalGrid.getSelectedNutrients(), function (nutrientIndex, nutrientName) {
                //alert('ingredientID: ' + ingredientID + ', ingredientIndex: ' + ingredientIndex + ', nutrientIndex: ' + nutrientIndex + ', nutrientName: ' + nutrientName +  ', value: ' + feedvalGrid.getCell(ingredientID, nutrientName) );
		nutrient_value =  feedvalGrid.getCell(ingredientID, nutrientName);
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
        return feedvalGrid.getCell(ingredientID, 'DM');
    },

    getFeedPriceMatrix: function (feedPrices, selectedIngredientIDs) {
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

    getFeedPriceMatrixAll: function (feedPrices, selectedIngredientIDs) {
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

	numberIngredientBiggerNumberNutrient = feedvalGrid.getNumberIngredientsBiggerThanNumberNutrients();
	if (numberIngredientBiggerNumberNutrient < 0) {
	    feedvalGrid.showNotnumberIngredientBiggerNumberNutrientMessage();
	    //alert('The Number of Ingredients has to be bigger or equal than the selected number of nutrients');
	}

        // if solution vector is empty
        /*if (solutionVector.length <= 0) {
            feedvalGrid.showNotOptimalSolutionMessage();
        }*/

	if (!feedvalGrid.selectionValid()) {
            feedvalGrid.invalidSelectionModal.modal('show');
        }
    },

    showNotOptimalSolutionMessage: function() {
        feedvalGrid.invalidSelectionModal.find('#SolNotOptimal').show();
    }, 

    showSolutionNotConvergedMessage: function () {
        feedvalGrid.invalidSelectionModal.find('#SolNoConverge').show();
    },

    showOnlyRupRdpSelectedMessage: function () {
        feedvalGrid.invalidSelectionModal.find('#rup_rdp').show();
    },

    showRupRdpCpSelectedMessage: function () {
        return false;
        feedvalGrid.invalidSelectionModal.find('#rup_rdp_cp').show();
    },

    showNutrientsToBeRemovedMessage: function (nutrientsToBeRemoved) {
        //return false;
        feedvalGrid.invalidSelectionModal.find('#nut_all_zeroes').show().find('span').text(nutrientsToBeRemoved.join(', '));
    },

    showNotnumberIngredientBiggerNumberNutrientMessage: function () {
	feedvalGrid.invalidSelectionModal.find('#NumIngBigNumNut').show();
    },

    clearColumns: function (columnsToClear) {
        var ingredients;
        ingredients = feedvalGrid.getAllIngredientIDs();
        $.each(columnsToClear, function (columnIndex, columnName) {
            $.each(ingredients, function (ingredientIndex, ingredientID) {
                feedvalGrid.grid.jqGrid('setCell', ingredientID, columnName, null, {"background-color": 'transparent'});
            });
        });
    },

    clearResults: function () {
        var summaryRow, resultColumns;

        resultColumns = ['Actual_Price', 'Predicted_Value'];
        feedvalGrid.clearColumns(resultColumns);

        //summaryRow = feedvalGrid.grid.jqGrid('footerData', 'get');
        summaryRow = feedvalGrid.grid.jqGrid('getRowData', 'data3');
        $.each(summaryRow, function (columnName) {
            summaryRow[columnName] = null;
        });
        //feedvalGrid.grid.jqGrid('footerData', 'set', summaryRow, false);
        feedvalGrid.grid.jqGrid('setRowData', 'data3',summaryRow);

        $('#r_square, #adjusted_r_square').text('');
    },

    getAllIngredientIDs: function () {
        return feedvalGrid.grid.jqGrid('getDataIDs');
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
 
        feedvalGrid.saveGrid();
        if (!this.selectionValid()) {
            this.displaySelectionErrorMessage();
            return;
        }

        allIngredientIDs = feedvalGrid.getAllIngredientIDs();
        selectedIngredientIDs = feedvalGrid.getSelectedIngredientIDs(); 
        //FIXME
	//console.log(selectedIngredientIDs)
	nonSelectedIngredientIDs = feedvalGrid.getNonSelectedIngredientIDs(); //NEW
	selectedNutrients = feedvalGrid.getSelectedNutrients();
	

        feedvalGrid.getFeedPrices(selectedIngredientIDs).done(function (actualFeedPrices) {
 
		 
	    actualFeedPriceMatrix = feedvalGrid.getFeedPriceMatrix(actualFeedPrices,selectedIngredientIDs);


            //FIXME:Check Improve calculateMinimization
	var columnsToAppear, data, ingredientID, unit, rawData;
        columnsToAppear = JSON.stringify(feedvalGrid.getWhitelistedColumns());
        rawData = feedvalGrid.grid.jqGrid('getRowData');
        console.log('RAW DATA');
        console.log('-------------');
        console.log(rawData);
        console.log('-------------');

        var valMax = 0;
        $.each(rawData, function (rowIndex, row) {
//            console.dir('kkk');
//            console.dir(row.Ingredient);
            ingredientID = row.ID;
            unit = feedvalGrid.getUnit(ingredientID);
            row.Unit = unit;
            if (row.Price_Unit == ""){
                row.Selected = "NO";
            }
            if(row.Ingredient=='Max'){
//                console.dir("aaaa");
//                console.dir(row);
		console.log(row.DM);
                valMax = row.DM;
            }
        });
        
        // going through and if max is 0, set as unchecked in rawData
        $.each(rawData, function(rowIndex, row) {
            if(row.Max_kgcowd==0 || row.Max_kgcowd=='0') {
                row.Selected = "NO";
            }
        });
        
        data = JSON.stringify(rawData);
	console.log(rawData);
        //console.log("data"); console.log(data);
        //console.log("Columns to appear"); console.log(columnsToAppear);
        solutionArray = calculateMinimization(data, columnsToAppear);
        solutionVector = solutionArray['0'];
        
        // check to make sure maxKg=0 ingredients not used ie all ingredients were used cause no solution
        var noSol = false;
        for(var i=0; i<solutionVector.length; i++) {
            var rowID = i+1;
            if(rowID > 40) break;
            var maxVal = feedvalGrid.getCell(rowID, 'Max_kgcowd');
            console.log("Max Value of ingredient: " + rowID + " = " + maxVal);
            if((maxVal==0 || maxVal=='0') && solutionVector[i] > 0) {
                noSol = true;
                break;
            }
        }  
        if(noSol) {
            feedvalGrid.invalidSelectionModal.find('li').hide();
            feedvalGrid.showNotOptimalSolutionMessage();
            feedvalGrid.invalidSelectionModal.modal('show');
            feedvalGrid.clearResults(); 
            return;
        } 
        console.log('solutionVector 2');
	console.log(solutionVector);
        console.log(nonSelectedIngredientIDs);
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

            
            displayPredictedNutrientPrices(predictedNutrientPriceMatrix,valMax);
	    //displayPredictedFeedPrices(predictedFeedPriceMatrix.elements); //FIXME:Change this for solution vector
            displaySolutionVector(solutionVector);
            //displayPercentageDifferences(percentageDifferenceMatrix.elements);
	    //displayRSquares();
	    displayEqResult(solutionArray['2']); 
	    //displayPredictedNonSelected(predictedFeedPriceMatrix.elements);
            //feedvalGrid.saveGrid();

            // FIXME: updating values for Evaluator
            feedvalGrid_calc.getAsFedFromOptimizer();

        });


        function calculateMinimization(data,columnsToAppear) {
        //var columnsToAppear, data, ingredientID, unit, rawData;
        var solutionArray;
        //columnsToAppear = JSON.stringify(feedvalGrid.getWhitelistedColumns());
        //rawData = feedvalGrid.grid.jqGrid('getRowData');
        //$.each(rawData, function (rowIndex, row) {
            //ingredientID = row.ID;
            //unit = feedvalGrid.getUnit(ingredientID);
            //row.Unit = unit;
        //});
        //data = JSON.stringify(rawData);
        minimize = 1;
	//console.log(data);
	//console.log(columnsToAppear);
        console.log("data in minimization");
        console.log("--------------------");
        console.log(data);
        console.log("--------------------");
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
            }
        });
        console.log("solution array in minimization");
        console.log("------------------------------");
        console.log(solutionArray);
        console.log("------------------------------");
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
              console.log("Selected ingredients: " + selectedIngredientIDs)
	      selectedIngredientIDs = selectedIngredientIDs.sort(function(a, b){return a-b})
	      //console.log("Selected ingredients: " + selectedIngredientIDs)
//	      console.log("Solution Vector: " + solutionVector)
              
	      X = feedvalGrid.getNutrientCoefficientMatrix(selectedIngredientIDs);
              //Y = actualFeedPriceMatrix;
              NutrientMatrix = JSON.stringify(X.transpose());
              var selectedNutrients = feedvalGrid.getSelectedNutrients();
	      var kg_DM = 0;
                $.each(selectedIngredientIDs, function (index, ingredientID){
              	    var ind = $('tr#' + ingredientID).find('td').html();      
                    var f1 = feedvalGrid.getCell(ingredientID,'DM');
                    var f2 = solutionVector[ind-1];
                    var p = f1*f2;
                    if(!isNaN(p)){
//                        kg_DM = kg_DM + feedvalGrid.getCell(ingredientID,'DM')*solutionVector[ingredientID-1];
                        kg_DM = kg_DM + p;
                    }
                    console.log("Index: " + ind + " ID: " + ingredientID + " Name: " + feedvalGrid.getCell(ingredientID,'Ingredient') + " DM: " + feedvalGrid.getCell(ingredientID,'DM') + " Sol: " + solutionVector[ind-1] + " Result: " + 
                    feedvalGrid.getCell(ingredientID,'DM')*solutionVector[ind-1])
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
//                    console.dir('b: ' + feedvalGrid.getCell(ingredientID,'DM'));
                    var ing = ingredientID-1;
              	    var ind = $('tr#' + ingredientID).find('td').html();      
//                    console.dir('id: '+ing);
//                    console.dir('c: ' + solutionVector[ingredientID-1]);
//                    if( dat_ing !== null && typeof(dat_ing) !== "undefined" ){
                    //var c = solutionVector[ingredientID-1];
                    var c = solutionVector[ind-1];
                    if(c !== null && typeof(c) !== "undefined"){
                        solutionNutrient = solutionNutrient + X.transpose().elements[nutrient_index][index]*feedvalGrid.getCell(ingredientID,'DM')*c*100;
                    }
                });
//                console.dir('nut:: '+solutionNutrient);
                solutionNutrient = solutionNutrient/percent_eff;
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
                feedvalGrid.setCell(ingredientID, 'Actual_Price', percentageDifference, {"background-color": color});
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
                    if(solutionVector[index] < 0) {
                        warning = true;
                        return;
                    }
                    //feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Selected', selected);
                    /*var sel;
                    var selRowIds = feedvalGrid.grid.jqGrid('getGridParam', 'selrow');
                    console.log("sel row ids "+selRowIds);
                    if($.inArray(ingredientID, selRowIds) >= 0) {
	                sel = true;
                    } else {
                        sel = false;
                    }*/
                    if( dat_ing !== null && typeof(dat_ing) !== "undefined" /*&& sel==true*/){
                        var color = getBackgroundColor(solutionVector[index]);
                        feedvalGrid.setCell(ingredientID, 'Predicted_Value', solutionVector[index].toFixed(3), {"background-color": color});
                    }/*else {
                        //alert("ERROR: Need to pick more ingredients to find solution.");
                        return;
                    }*/
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
		    //feedvalGrid.setCell(ingredientID, 'Predicted_Value', predictedFeedPrice.toFixed(3) + '/' + ingredients[index].toUnit);
         	    var color = getBackgroundColor(diffPrice);
		    feedvalGrid.setCell(ingredientID, 'Actual_Price', diffPrice, {"background-color": color});
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




        function displayPredictedNutrientPrices(Horizontal_solution,valMax) {

            var formattedPrices = {}, unit; //flattened, unit;
            var violations = {};
            var warning = false;
	    console.log(Horizontal_solution); 
            //flattened = getFlattenedArray(predictedNutrientPrices);
            $.each(Horizontal_solution, function (index, price) {
            	if(selectedNutrients[index] == 'NEl3x_Mcalkg')
			unit='\n'+'Mcal/Kg';
		else 
			unit='\n'+'%DM';
                // need to check within min and max values
	        var min = feedvalGrid.getCell(41, selectedNutrients[index]);
	        var max = feedvalGrid.getCell(42, selectedNutrients[index]);
                var tp = price;
                if(/*selectedNutrients[index] != 'Phos' &&*/ selectedNutrients[index] != 'Starch' && selectedNutrients[index] != 'NEl3x_Mcalkg') {
                    tp = tp/100;
                }
                tp = tp.toFixed(3);
                min = parseFloat(min).toFixed(3);
                max = parseFloat(max).toFixed(3);
                if(tp < min || tp > max) {
                    warning = true;
                    violations[selectedNutrients[index]] = true;

		    formattedPrices[selectedNutrients[index]] = "<span style='color:red'>" + price.toFixed(3)+unit + "</span>";
                }else {
		    formattedPrices[selectedNutrients[index]] = price.toFixed(3)+unit;
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
        var unitval = valMax/kgasfed;
	//Extra In for horizontal solution
	formattedPrices['Ingredient'] = 'Solution: '; //Solution Word
        //formattedPrices['DM'] = parseFloat(Math.round(valMax * 100) / 100).toFixed(3) + ' kg DM';//Max
        formattedPrices['DM'] = parseFloat(valMax).toFixed(3) + ' kg DM';//Max
        //formattedPrices['Predicted_Value'] = parseFloat(Math.round(kgasfed * 100) / 100).toFixed(3) + ' kg as fed';
        formattedPrices['Min_kgcowd'] = parseFloat(Math.round(kgasfed * 100) / 100).toFixed(3) + ' kg as fed';
        var prod = parseFloat(solutionArray['2']);
        formattedPrices['Price_Unit'] = parseFloat(Math.round(prod * 1000) / 1000).toFixed(3) + ' $/cow.d';
        //alert(prod);
        //var tmpcalc = 100*parseFloat(Math.round(unitval * 100) / 100);
	var tmpcalc = 100*parseFloat(unitval);
        formattedPrices['Unit'] = tmpcalc.toFixed(3) + ' %DM';
        
        formattedPrices['Predicted_Value'] = 0;
        var nvalCalc = parseFloat(solutionArray['2']/valMax).toFixed(3);
        if(nvalCalc){
            formattedPrices['Predicted_Value'] = nvalCalc;
            formattedPrices['Predicted_Value'] += ' <br />$/kg DM';
        }
      
        // calcualte DM Forage variables
	    var dm_forage = 0;
	    var ndf_forage = 0;
            allIngredients = feedvalGrid.getAllIngredientIDs();
	    console.log(solutionVector);
 	    $.each(allIngredients, function (index, ingredientID) {
               var ind = $('tr#' + ingredientID).find('td').html();      
	        var NDF = parseFloat(feedvalGrid.getCell(ingredientID, 'NDF'));	
		var cur_dm = parseFloat(feedvalGrid.getCell(ingredientID, 'DM'));
		var max = parseFloat(feedvalGrid.getCell(ingredientID, 'Max_kgcowd'));
		if(ind < 7 && ind > 0) {
		    console.log("ind: " +ind+ " solution value: "+solutionVector[ind-1]+ " NDF: "+NDF+" DM%: "+cur_dm);
		    dm_forage = dm_forage + parseFloat(cur_dm*solutionVector[ind-1]);console.log(dm_forage);
		    ndf_forage = ndf_forage + parseFloat(NDF*cur_dm*solutionVector[ind-1]);
		    //alert(ingredientID + "   " + parseFloat(NDF*cur_dm*solutionVector[ingredientID-1]));
		}
            });
	console.log("DM forage " + dm_forage);
	var dm_total = parseFloat(formattedPrices['DM']);
	var forage_DM = parseFloat((dm_forage/dm_total)*100).toFixed(3);
        var NDF_forage = parseFloat(((dm_forage * (parseFloat(formattedPrices['NDF'])/100))/dm_total)*100).toFixed(3);	
	//feedvalGrid.setCell(43, forage_DM);
	//feedvalGrid.setCell(44, NDF_forage);
        feedvalGrid.grid.jqGrid('setRowData','data3',formattedPrices); //FIXME: Change this data according to minimization template
	forage_DM = forage_DM + ' %DM forage';
	ndf_forage = ndf_forage.toFixed(3) + ' %DM NDF from forage';
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
        if(rowID==='header2' || rowID==='header3' || rowID==='separator' || rowID==='data3' || rowID==='data4' || rowID==='data5'){
            var tmprow = rowID;
            gridSelector = $("#" + this.id);
            gridSelector.restoreCell(iRow, iCol);
            $('#grid tr[id^="'+tmprow+'"]').removeClass('ui-state-hover');
            $('#grid tr[id^="'+tmprow+'"]').find("td").eq(iCol).removeAttr('class');
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
            if(ingredientID <= 40) {
                feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Selected', selected);
            }
        });
        feedvalGrid.clearResults();
    },


    afterSaveCell: function () {
        feedvalGrid.clearResults();
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
            }).change(function (eventObject) {
                var tr, ingredientID, ingredientName, price, select, toUnit;
		feedvalGrid.clearResults();
                select = $(eventObject.target);
                toUnit = select.val();
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
            
            $('#grid tr[id^="header2"]').find("td").each(function( index ){
                if(index>1){
                    var ni = parseInt(1*index-4);
                    if(arr_h2[ni]){
                        var tmp = ''+arr_h2[ni]+'';
                        $(this).html(tmp);
                    }
                }
            });
            $('#grid tr[id^="header3"]').find("td").each(function( index ){
                if(index>1){
                    var ni = parseInt(1*index-4);
                    if(arr_h3[ni]){
                        var tmp = ''+arr_h3[ni]+'';
                        $(this).html(tmp);
                    }
                }
            });
            $("#header2").css( "height", "42px!important" );
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
            feedvalGrid.grid.jqGrid('setCell', 35, 'Ingredient', 'Alfalfa Silage');
	    feedvalGrid.grid.jqGrid('setCell', 35, 'NEl3x_Mcalkg', 0.6);
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
	    feedvalGrid.grid.jqGrid('setCell', 36, 'NEl3x_Mcalkg', 0.55);
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

	    var rows = [35, 36, 7, 8, 9, 16]
            
	    for(var i=1; i<=rows.length; i++) {
                /*var tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'Ingredient');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'Ingredient', feedvalGrid.grid.jqGrid('getCell', i, 'Ingredient'));
		feedvalGrid.grid.jqGrid('setCell', i, 'Ingredient', tmp);

		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'NEl3x_Mcalkg');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'NEl3x_Mcalkg', feedvalGrid.grid.jqGrid('getCell', i, 'NEl3x_Mcalkg'));
		feedvalGrid.grid.jqGrid('setCell', i, 'NEl3x_Mcalkg', tmp);
	
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'CP');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'CP', feedvalGrid.grid.jqGrid('getCell', i, 'CP'));
		feedvalGrid.grid.jqGrid('setCell', i, 'CP', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'NDF');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'NDF', feedvalGrid.grid.jqGrid('getCell', i, 'NDF'));
		feedvalGrid.grid.jqGrid('setCell', i, 'NDF', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'RUP');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'RUP', feedvalGrid.grid.jqGrid('getCell', i, 'RUP'));
		feedvalGrid.grid.jqGrid('setCell', i, 'RUP', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'RDP');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'RDP', feedvalGrid.grid.jqGrid('getCell', i, 'RDP'));
		feedvalGrid.grid.jqGrid('setCell', i, 'RDP', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'Lipid');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'Lipid', feedvalGrid.grid.jqGrid('getCell', i, 'Lipid'));
		feedvalGrid.grid.jqGrid('setCell', i, 'Lipid', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'peNDF');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'peNDF', feedvalGrid.grid.jqGrid('getCell', i, 'peNDF'));
		feedvalGrid.grid.jqGrid('setCell', i, 'peNDF', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'Ca');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'Ca', feedvalGrid.grid.jqGrid('getCell', i, 'Ca'));
		feedvalGrid.grid.jqGrid('setCell', i, 'Ca', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'Phos');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'Phos', feedvalGrid.grid.jqGrid('getCell', i, 'Phos'));
		feedvalGrid.grid.jqGrid('setCell', i, 'Phos', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'Starch');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'Starch', feedvalGrid.grid.jqGrid('getCell', i, 'Starch'));
		feedvalGrid.grid.jqGrid('setCell', i, 'Starch', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'DM');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'DM', feedvalGrid.grid.jqGrid('getCell', i, 'DM'));
		feedvalGrid.grid.jqGrid('setCell', i, 'DM', tmp);
	        
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'Price_Unit');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'Price_Unit', feedvalGrid.grid.jqGrid('getCell', i, 'Price_Unit'));
		feedvalGrid.grid.jqGrid('setCell', i, 'Price_Unit', tmp);
                   
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'Max_kgcowd');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'Max_kgcowd', feedvalGrid.grid.jqGrid('getCell', i, 'Max_kgcowd'));
		feedvalGrid.grid.jqGrid('setCell', i, 'Max_kgcowd', tmp);
               
		tmp = feedvalGrid.grid.jqGrid('getCell', rows[i-1], 'Min_kgcowd');
                feedvalGrid.grid.jqGrid('setCell', rows[i-1], 'Min_kgcowd', feedvalGrid.grid.jqGrid('getCell', i, 'Min_kgcowd'));
		feedvalGrid.grid.jqGrid('setCell', i, 'Min_kgcowd', tmp);
	*/	
                $('#grid tr[id="'+rows[i-1]+'"]').removeClass('ui-state-highlight');
		$('#grid tr[id="'+rows[i-1]+'"]').addClass('ui-state-highlight-forage');
		//alert(i);	
            }
            rawData = feedvalGrid.grid.jqGrid('getRowData');
	    console.log(rawData);
	    var NDF;
	    var peNDF;
	    var ingredientName;
            allIngredients = feedvalGrid.getAllIngredientIDs();
	    $.each(allIngredients, function (index, ingredientID) {
	        NDF = feedvalGrid.getCell(ingredientID, 'NDF');	
                peNDF = feedvalGrid.getCell(ingredientID, 'peNDF');
                if (NDF > 0) {
                    if (peNDF <= 0) {
			peNDF = 0.25*parseFloat(NDF)*100;
			feedvalGrid.setCell(ingredientID, 'peNDF', peNDF.toFixed(2));
                    }	
		}
		ingredientName = feedvalGrid.getCell(ingredientID, 'Ingredient');
		if(ingredientName == 'Tallow' || ingredientName == 'Barley')
		    $('tr#' + ingredientID).find('select.unit').val('cwt');
            });
	
 	    feedvalGrid.setCell(41, 'DM', 23);	
 	    feedvalGrid.setCell(42, 'DM', 23);	
	    $('div#jqgh_grid_Min_kgcowd').text('Min lb/cow.d');
	    $('div#jqgh_grid_Max_kgcowd').text('Max lb/cow.d');
	    $('div#jqgh_grid_Predicted_Value').text('Solution lb/cow.d');
		
	
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
            if ($.trim(price) != '' /*&& $.trim(price) != 0*/) {
                feedvalGrid.grid.jqGrid('setSelection', ingredientID, false);
            } else if (ing == 'Urea'){
		feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Price_Unit', 472); //Hardcoding price of Urea, FIXME: find a better place for this
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

    getWhitelistedColumns: function () {
        var whitelistedColumns = [], colModel;
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
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
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

    convertToKg: function () {
            var allIngredientIDs, ingredients = [], price;
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
            });
            feedvalGrid.convertUnits(ingredients).done(function (pricesInKG) {
                
                //console.log("in prices kg");
                var priceInKG;
                $.each(allIngredientIDs, function (index, ingredientID) {
    //                var sel = "<select class='unit'><option value='ton'>ton</option><option value='cwt'>cwt</option><option value='kg' selected='selected'>kg</option></select>";
    //                if(index < 40) {
    //                    feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Unit', sel);
     //               }
                    $('tr#' + ingredientID).find('select.unit').val('kg');
		    $('table#grideval').find('tr#' + ingredientID).find('select.unit').val('kg');
                    //console.log($('tr#' + ingredientID).find('select.unit'));
                    if (pricesInKG[ingredientID])  
		    {
                        priceInKG = parseFloat(pricesInKG[ingredientID]);
			feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceInKG.toFixed(3));
                    }
                });
            });
    }, 

    updatePrices: function (date) {
	alert("in update prices");
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
		      if(unit == 'kg' || price =='') 
			{
				$('tr#' + ingredientID).find('select.unit').val('ton');
		        
			}
		      if(ingredientName == 'Tallow' || ingredientName == 'Barley')
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
        beforeSubmit: function () {
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

        $('#convert-to-kgs').bind('click', function () {
            feedvalGrid.convertToKg();
            feedvalGrid_calc.convertToKg();
            /* var allIngredientIDs, ingredients = [], price;
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
            });
            feedvalGrid.convertUnits(ingredients).done(function (pricesInKG) {
                
                //console.log("in prices kg");
                var priceInKG;
                $.each(allIngredientIDs, function (index, ingredientID) {
                    $('tr#' + ingredientID).find('select.unit').val('kg');
                    //console.log($('tr#' + ingredientID).find('select.unit'));
                    if (pricesInKG[ingredientID])  
		    {
                        priceInKG = parseFloat(pricesInKG[ingredientID]);
			feedvalGrid.grid.jqGrid('setCell', ingredientID, 'Price_Unit', priceInKG.toFixed(3));
                    }
                });
            });
       */ });
    }

});
