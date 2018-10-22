<?php

date_default_timezone_set('America/Chicago');

class FeedValSpreadsheetXML extends FeedValXML {

    /**
     * Creates a new FeedValSpreadsheetXML.
     * @param string $spreadsheetFileName the spreadsheet file.
     */
    public function __construct($spreadsheetFileName)
    {
        parent::__construct();
        $this->feedValDao = new FeedvalSpreadsheetDao($spreadsheetFileName);
    }

    private function getAllIngredientIDs()
    {
        $allIngredientIDs = array();
        $db = FeedValDatabaseConnectionFactory::getConnection();
        $query = 'SELECT INGREDIENT_ID, INGREDIENT FROM ingredients ORDER BY INGREDIENT_ID ASC';
        foreach ($db->query($query) as $row) {
            $allIngredientIDs[$row['INGREDIENT']] = $row['INGREDIENT_ID'];
        }

        return $allIngredientIDs;
    }

    private function getIngredientIDs($ingredients)
    {
        $allIngredientIDs = $this->getAllIngredientIDs();
        $ingredientIDs = array();
        foreach ($ingredients as $ingredient) {
            if (array_key_exists($ingredient, $allIngredientIDs)) {
                $ingredientID = $allIngredientIDs[$ingredient];
            } else {
                $ingredientID = $this->getDefaultIngredientID($allIngredientIDs);
                $allIngredientIDs[$ingredient] = $ingredientID;
            }
            $ingredientIDs[$ingredient] = $ingredientID;
        }
        return $ingredientIDs;
    }

    private function getDefaultIngredientID($allIngredientIDs)
    {
        $min = min($allIngredientIDs);
        $max = max($allIngredientIDs);
        if ($max - $min + 1 == count($allIngredientIDs)) {
            return $max + 1;
        }
        $i = $min + 1;
        while (in_array($i, $allIngredientIDs)) {
            $i += 1;
        }
        return $i;
    }

	public function getXML()
    {
        $nutrients = $this->feedValDao->getNutrients();
        $ingredients = $this->feedValDao->getIngredients();
        $spreadsheetRows = $this->feedValDao->getRows();
        $numIngredients = count($spreadsheetRows);

        $nutrientXMLTags = $this->getXMLTags($nutrients);
        $ingredientIDs = $this->getIngredientIDs($ingredients);
        $permittedUnits = $this->getPermittedUnits();
        

        $xmlRows = $this->xmlDoc->createElement(self::XML_ROWS_ELEMENT);
        $cont = 0;
        $log = "";
		foreach ($spreadsheetRows as $spreadsheetRow) {
                    $cont++;
                    $xx = $ingredientIDs[$spreadsheetRow->getIngredientName()];
                    $log .= "cont: $cont -- ingredientIDs: $xx ///";
                    if(in_array($spreadsheetRow->getIngredientName(), array('Ingredient','Condition',''))){
                        continue;
                    }
                    
                    
                    $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
                    
                    $xmlRow->appendChild($this->newXMLElement(self::ID, $ingredientIDs[$spreadsheetRow->getIngredientName()]));
                    $xmlRow->appendChild($this->newXMLElement(self::SELECTED, $spreadsheetRow->getSelected()));
                    $xmlRow->appendChild($this->newXMLElement(self::INGREDIENT, $spreadsheetRow->getIngredientName()));
                    $xmlRow->appendChild($this->newXMLElement(self::DM, $spreadsheetRow->getDMPercent()));
                    $xmlRow->appendChild($this->newXMLElement(self::MINOP, $spreadsheetRow->getMINOP()));
                    $xmlRow->appendChild($this->newXMLElement(self::MAXOP, $spreadsheetRow->getMAXOP()));
                    
//                    if($ingredientIDs[$spreadsheetRow->getIngredientName()]<'41'){
                    if($ingredientIDs[$spreadsheetRow->getIngredientName()]!='41' && $ingredientIDs[$spreadsheetRow->getIngredientName()]!='42'){
                        $unitSelectElement = $this->getUnitsSelectElement($permittedUnits, $spreadsheetRow->getUnit());
                        $xmlRow->appendChild($this->newXMLElement(self::UNIT, $unitSelectElement));
                    }
//                    $xmlRow->appendChild($this->newXMLElement(self::PRICE, number_format($spreadsheetRow->getPrice(), 2, ".", "")));
                    $xmlRow->appendChild($this->newXMLElement(self::PRICE, $spreadsheetRow->getPrice()));

                    $nutrientCompositions = $spreadsheetRow->getNutrientCompositions();
                    foreach ($nutrientCompositions as $nutrient => $composition) {
//                        $xmlRow->appendChild($this->newXMLElement($nutrientXMLTags[$nutrient], number_format($composition, 2, ".", "")));
                        $xmlRow->appendChild($this->newXMLElement($nutrientXMLTags[$nutrient], $composition));
                    }
                    if ($this->needToAppendCP()) {
                        $xmlRow->appendChild($this->newXMLElement(self::CP, $this->getCPPCT($nutrientCompositions)));
                    }

                    $xmlRows->appendChild($xmlRow);
                    
                    if($cont==$numIngredients-2){
//                    if(in_array($ingredientIDs[$spreadsheetRow->getIngredientName()], array('43','44',''))){
//                        if($ingredientIDs[$spreadsheetRow->getIngredientName()]==43){
                            $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
                            $xmlRow->appendChild($this->newXMLElement(self::ID, 'header2'));
                            $xmlRows->appendChild($xmlRow);

//                            $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
//                            $xmlRow->appendChild($this->newXMLElement(self::ID, 'separator'));
//                            $xmlRows->appendChild($xmlRow);
//
//                            $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
//                            $xmlRow->appendChild($this->newXMLElement(self::ID, 'header3'));
//                            $xmlRows->appendChild($xmlRow);
//                        }
//                        continue;
                    }
		}
                
//                echo $log;
//                die();

        $xmlRoot = $this->xmlDoc->createElement(self::XML_ROOT_ELEMENT);
        $xmlRoot->appendChild($xmlRows);
        $this->xmlDoc->appendChild($xmlRoot);

        return $this->xmlDoc;
	}

    private function getJqGridColModel()
    {
		$colModel = array();

        $colModel[] = $this->superColModel[self::ID];
        $colModel[] = $this->superColModel[self::SELECTED];
        $colModel[] = $this->superColModel[self::INGREDIENT];

        $nutrients = $this->feedValDao->getNutrients();
        $nutrientXMLTags = $this->getXMLTags($nutrients);
        foreach ($nutrientXMLTags as $nutrientXMLTag) {
            $colModel[] = $this->superColModel[$nutrientXMLTag];
        }
        if ($this->needToAppendCP()) {
            $colModel[] = $this->superColModel[self::CP];
        }
        $colModel[] = $this->superColModel[self::DM];
	$colModel[] = $this->superColModel[self::MINOP];
	$colModel[] = $this->superColModel[self::MAXOP];
        $colModel[] = $this->superColModel[self::UNIT];
        $colModel[] = $this->superColModel[self::PRICE];
        $colModel[] = $this->superColModel[self::PREDICTED_VALUE];
        $colModel[] = $this->superColModel[self::ACTUAL_PRICE];
		
		return $colModel;
	}

    public function getJqGridSettings()
    {
        $yaml = yaml_parse_file(self::JQGRID_SETTINGS_FILE);
        $jqGridSettings = $yaml['settings'];
        $jqGridSettings['colModel'] = $this->getJqGridColModel();
        return $jqGridSettings;
    }

    public function getNumberOfNutrients()
    {
        return $this->feedValDao->getNumberOfNutrients();
    }


}

?>
