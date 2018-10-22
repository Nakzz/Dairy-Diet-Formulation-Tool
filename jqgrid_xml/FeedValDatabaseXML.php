<?php


class FeedValDatabaseXML extends FeedValXML {

    public function __construct()
    {
        parent::__construct();
        $this->feedValDao = new FeedValDatabaseDao();
    }

    private function getInitialLoadDate()
    {
        $todaysDate = new DateTime('now');
        $maxDate = new DateTime($this->feedValDao->getMaxDate());
        $initialLoadDate = $maxDate > $todaysDate? $todaysDate : $maxDate;

        return $initialLoadDate->format('Y-m-d');
    }

    public function getXML()
    {
        $xmlRows = $this->xmlDoc->createElement(self::XML_ROWS_ELEMENT);
        $compositions = $this->feedValDao->getNutrientCompositions();
        $initialLoadDate = $this->getInitialLoadDate();
        $permittedUnits = $this->getPermittedUnits();
        $requiredUnits = $this->feedValDao->getRequiredUnits();
        $todaysPrices = $this->feedValDao->getPricesForDate($initialLoadDate);
        
        foreach ($compositions as $compositionRow){

            if($compositionRow[self::ID]=='41'){
                $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
                $xmlRow->appendChild($this->newXMLElement('ID', 'header2'));
                $xmlRows->appendChild($xmlRow);

                $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
                $xmlRow->appendChild($this->newXMLElement('ID', 'separator'));
                $xmlRows->appendChild($xmlRow);

                $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
                $xmlRow->appendChild($this->newXMLElement('ID', 'header3'));
                $xmlRows->appendChild($xmlRow);
            }
            
            $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
            $ingredientID = $compositionRow[self::ID];
            $ingRequiredUnit = $requiredUnits[$ingredientID]['unit'];
//            var_dump($compositionRow);
//            die();
	    $numRows;
            foreach ($compositionRow as $tag => $value) {
//                $formattedValue = $this->formatValue($value);
                
                if(is_numeric($value)){
//                    $formattedValue = number_format($value, 2, ".", "");
                    $formattedValue = round($value, 2);
//                    $formattedValue = round($value * 100) / 100;
//                    $formattedValue = number_format($value, 2, ".", "");
//                    $formattedValue = number_format($value, 2, ".", "");
                }else{
                    $formattedValue = $value;
                }
                
                $xmlMap = $this->superColModel[$tag]['xmlmap'];
                if($compositionRow[self::ID]>='41'){
                    if(in_array($xmlMap, array('Max_kgcowd','Min_kgcowd'))){
                        continue;
                    }
                }
                $xmlRow->appendChild($this->newXMLElement($xmlMap, $formattedValue));
            }
            if($compositionRow[self::ID]<'41'){
                $unitsSelectElement = $this->getUnitsSelectElement($permittedUnits, $ingRequiredUnit);
                $xmlRow->appendChild($this->newXMLElement(self::UNIT, $unitsSelectElement));
            }
            if ($this->needToAppendCP()) {
                $cpPct = $this->getCPPCT($compositionRow);
                $xmlRow->appendChild($this->newXMLElement(self::CP, $cpPct));
            }

            $latestPrice = $this->getPriceInRequiredUnit($compositionRow, $todaysPrices, $ingRequiredUnit);
            $xmlRow->appendChild($this->newXMLElement(self::PRICE, $this->formatValue($latestPrice)));
//            $xmlRow->appendChild($this->newXMLElement(self::PRICE, number_format($latestPrice, 2, ".", "")));

            $xmlRows->appendChild($xmlRow);
	    $numRows = $compositionRow[self::ID];
        }
        $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
        $xmlRow->appendChild($this->newXMLElement('ID', 'data3'));
        $xmlRows->appendChild($xmlRow);
 
        $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
        $xmlRow->appendChild($this->newXMLElement('ID', 'data4'));
        $xmlRows->appendChild($xmlRow);
  
        $xmlRow = $this->xmlDoc->createElement(self::XML_ROW_ELEMENT);
        $xmlRow->appendChild($this->newXMLElement('ID', 'data5'));
        $xmlRows->appendChild($xmlRow);
        

        $xmlRoot = $this->xmlDoc->createElement(self::XML_ROOT_ELEMENT);
        $xmlRoot->appendChild($xmlRows);
        $this->xmlDoc->appendChild($xmlRoot);

        return $this->xmlDoc;
    }

    private function getPriceInRequiredUnit($compositionRow, $prices, $requiredUnit)
    {
        if (!isset($prices[$compositionRow[self::ID]])) {
            return NULL;
        }
        $ingredient = $compositionRow[self::INGREDIENT];
        $price = $prices[$compositionRow[self::ID]]['price'];
        $sourceUnit = $prices[$compositionRow[self::ID]]['unit'];
        $value = UnitConverter::getPriceInUnit($ingredient, $price, $sourceUnit, $requiredUnit);

        return $value;
    }

    private function formatValue($value)
    {
        if (is_numeric($value)) {
            return round($value, 2);
//            return number_format($value, 2, ".", "");
        }

        return $value;
    }

    public function getJQGridSettings()
    {
        $yaml = yaml_parse_file(self::JQGRID_SETTINGS_FILE);
        $jqGridSettings = $yaml['settings'];
        $jqGridSettings['colModel'] = $this->getJQGridColModel();

        return $jqGridSettings;
    }

    private function getJQGridColModel()
    {
        $colModel = array();
        foreach ($this->superColModel as $column) {
            $colModel[] = $column;
        }

        return $colModel;
    }

    public function getNumberOfNutrients()
    {
        return $this->feedValDao->getNumberOfNutrients();
    }
}
