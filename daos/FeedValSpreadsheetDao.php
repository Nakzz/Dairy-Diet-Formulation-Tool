<?php

date_default_timezone_set('America/Chicago');



class FeedvalSpreadsheetDao extends FeedValDao {

    /**
     * @var PHPExcel the PHPExcel object.
     */
    private $objPHPExcel;
    private $firstWorksheet;
    private $ingredients;
    private $nutrients;

    const FIRST_COLUMN_INDEX = 0;
    const SELECTED_COLUMN_INDEX = 0;
    const INGREDIENT_COLUMN_INDEX = 1;
    const NUTRIENTS_START_COLUMN_INDEX = 2;
    const FIRST_ROW_INDEX = 1;
    const NUTRIENT_ROW_INDEX = 1;
    const INGREDIENTS_START_ROW_INDEX = 2;

    const DM_PERCENT_REGEX = '/^dm\s*%/i';
    const RESULT_COLUMNS_REGEX = '/^(?:predicted\s*value|actual\s*price)/i';
    const EXTRA_INGREDIENTS_REGEX = '/extra\s*ingredient/i';
    const NUM_NON_NUTRIENT_COLUMNS = 5;

    public function __construct($inputFileName) {
	$this->objPHPExcel = $this->createPHPExcelObject($inputFileName);
        $this->firstWorksheet = $this->objPHPExcel->getSheet(0);
        $this->nutrients = $this->_getNutrients();
        $this->ingredients = $this->_getIngredients();
	}

    public function getNutrients()
    {
        return $this->nutrients;
    }

    public function getIngredients()
    {
        return $this->ingredients;
    }

    public function getNumberOfNutrients()
    {
        return count($this->nutrients);
    }

    private function _getNutrients()
    {
        $nutrients = array();
        $pastNutrientColumns = FALSE;
        $column = self::NUTRIENTS_START_COLUMN_INDEX;

        while (!$pastNutrientColumns && $this->cellExistsAt($column, self::NUTRIENT_ROW_INDEX)) {
            $cellValue = trim($this->getValueAt($column, self::NUTRIENT_ROW_INDEX));
            if (preg_match(self::DM_PERCENT_REGEX, $cellValue)) {
                $pastNutrientColumns = TRUE;
            } else {
                $nutrients[] = $cellValue;
                $column++;
            }
        }

        return $nutrients;
    }

    private function getNumberOfIngredients()
    {
        return count($this->ingredients);
    }

    private function _getIngredients()
    {
        $ingredients = array();
        $pastLastRow = FALSE;
        $row = self::INGREDIENTS_START_ROW_INDEX;
        $cont_space = 0;

        while (!$pastLastRow && $this->cellExistsAt(self::INGREDIENT_COLUMN_INDEX, $row)) {
            $cellValue = trim($this->getValueAt(self::INGREDIENT_COLUMN_INDEX, $row));
            if ($cellValue == '' || preg_match(self::EXTRA_INGREDIENTS_REGEX, $cellValue)) {
                $cont_space++;
                    $pastLastRow = TRUE;
            } else {
                $ingredients[] = $cellValue;
                $row++;
            }
            if($cellValue=='Ingredient'){
                $row++;
            }
        }
        return $ingredients;
    }

    private function cellExistsAt($col, $row)
    {
        return $this->firstWorksheet->cellExistsByColumnAndRow($col, $row);
    }

    private function getValueAt($col, $row)
    {
        return $this->firstWorksheet->getCellByColumnAndRow($col, $row)->getCalculatedValue();
    }

    private function getDMColumnNumber()
    {
        return self::NUTRIENTS_START_COLUMN_INDEX + $this->getNumberOfNutrients();
    }

      private function getMINOPColumnNumber()
    {
        return self::NUTRIENTS_START_COLUMN_INDEX + $this->getNumberOfNutrients() + 1;
    }

    private function getMAXOPColumnNumber()
    {
        return self::NUTRIENTS_START_COLUMN_INDEX + $this->getNumberOfNutrients() + 2;
    }

    private function getPriceColumnNumber()
    {
        return self::NUTRIENTS_START_COLUMN_INDEX + $this->getNumberOfNutrients() + 4;
    }

    private function getUnitColumnNumber()
    {
        return self::NUTRIENTS_START_COLUMN_INDEX + $this->getNumberOfNutrients() + 3;
    }

    public function getRows()
    {
        $rows = array();
        for ($i = 0; $i <= $this->getNumberOfIngredients(); $i++) {
            $spreadsheetRowNumber = self::INGREDIENTS_START_ROW_INDEX + $i;
            $selected = $this->getValueAt(self::SELECTED_COLUMN_INDEX, $spreadsheetRowNumber);
            $ingredientName = $this->getValueAt(self::INGREDIENT_COLUMN_INDEX, $spreadsheetRowNumber);
            $DMPercent = $this->getValueAt($this->getDMColumnNumber(), $spreadsheetRowNumber);
            $MINOP = $this->getValueAt($this->getMINOPColumnNumber(), $spreadsheetRowNumber);
            $MAXOP = $this->getValueAt($this->getMAXOPColumnNumber(), $spreadsheetRowNumber);
            $price = $this->getValueAt($this->getPriceColumnNumber(), $spreadsheetRowNumber);
            $unit = $this->getValueAt($this->getUnitColumnNumber(), $spreadsheetRowNumber);
            $feedValSpreadsheetRow = new FeedValSpreadsheetRow($selected, $ingredientName, $DMPercent, $MINOP, $MAXOP, $price, $unit);

            for ($j = 0; $j < $this->getNumberOfNutrients(); $j++) {
                $nutrient = $this->nutrients[$j];
                $nutrientColumnNumber = self::NUTRIENTS_START_COLUMN_INDEX + $j;
                $composition = $this->getValueAt($nutrientColumnNumber, $spreadsheetRowNumber);
                $feedValSpreadsheetRow->addNutrientComposition($nutrient, $composition);
            }

            $rows[] = $feedValSpreadsheetRow;
        }

        return $rows;
    }

    private function createPHPExcelObject($fileName)
    {
		$fileType = PHPExcel_IOFactory::identify($fileName);
		$objReader = PHPExcel_IOFactory::createReader($fileType);
		$objReader->setReadDataOnly(true);

		return $objReader->load($fileName);
	}
}

class FeedValSpreadsheetRow
{
    private $selected;
    private $ingredientName;
    private $nutrientCompositions = array();
    private $DMPercent;
    private $MINOP;
    private $MAXOP;
    private $price;
    private $unit;

    public function __construct($selected, $ingredientName, $DMPercent, $MINOP, $MAXOP, $price, $unit)
    {
        $this->selected = $selected;
        $this->ingredientName = $ingredientName;
        $this->DMPercent = $DMPercent;
        $this->MINOP = $MINOP;
        $this->MAXOP = $MAXOP;
        $this->price = $price;
        $this->unit = $unit;
    }

    public function getDMPercent()
    {
        return $this->DMPercent;
    }


    public function getMINOP()
    {
 	return $this->MINOP;
    }
    
    public function getMAXOP()
    {
        return $this->MAXOP;
    }

    public function getIngredientName()
    {
        return $this->ingredientName;
    }

    public function getNutrientCompositions()
    {
        return $this->nutrientCompositions;
    }

    public function getPrice()
    {
        return $this->price;
    }

    public function getSelected()
    {
        return $this->selected;
    }

    public function getUnit()
    {
        return $this->unit;
    }

    public function setDMPercent($DMPercent)
    {
        $this->DMPercent = $DMPercent;
    }

    public function setMINOP($MINOP)
    {
	$this->MINOP = $MINOP;
    }
   
    public function setMAXOP($MAXOP)

    {
	$this->MAXOP = $MAXOP;
    }

    public function setIngredientName($ingredientName)
    {
        $this->ingredientName = $ingredientName;
    }

    public function addNutrientComposition($nutrientName, $nutrientComposition)
    {
        $this->nutrientCompositions[$nutrientName] = $nutrientComposition;
    }

    public function setPrice($price)
    {
        $this->price = $price;
    }

    public function setSelected($selected)
    {
        $this->selected = $selected;
    }

    public function setUnit($unit)
    {
        $this->unit = $unit;
    }

}

?>
