<?php

/**
 * Represents a FeedVal 2012 spreadsheet. Provides functionality to create one.
 */
class FeedValSpreadsheet
{
    const JQGRID_COLMODEL_FILE = 'conf/jqGridColModelcalc.yaml';

    private $objPHPExcel;
    private $headerStyle = array('font' => array('bold' => TRUE));

    const SPREADSHEET_START_ROW = 1;
    const SPREADSHEET_START_COLUMN = 0;

    const YES = 'YES';
    const NO = 'NO';

    public function __construct($columnsToAppear, $data)
    {
        $this->objPHPExcel = new PHPExcel();
        $this->createSpreadsheet($columnsToAppear, $data);
    }

    private function getColModel()
    {
        $yaml = yaml_parse_file(self::JQGRID_COLMODEL_FILE);
        return $yaml['colModel'];
    }

    private function setColumnHeaders($worksheet, $columnsToAppear)
    {
        
        $colModel = $this->getColModel();
//        var_dump($colModel);
//        die();    
        foreach ($columnsToAppear as $columnIndex => $columnName) {
            $cellValue = $colModel[$columnName]['label'];
            $worksheet->setCellValueByColumnAndRow($columnIndex, self::SPREADSHEET_START_ROW, $cellValue);
            $worksheet->getStyleByColumnAndRow($columnIndex, self::SPREADSHEET_START_ROW)->applyFromArray($this->headerStyle);
        }
    }

    private function fillRows($worksheet, $columnsToAppear, $data)
    {
        $rowNum = self::SPREADSHEET_START_ROW + 1;
        foreach ($data as $dataRow) {
            $id_now = $dataRow["ID"];
            
            foreach ($columnsToAppear as $columnIndex => $columnName) {
                
                $worksheet->setCellValueByColumnAndRow($columnIndex, $rowNum, $dataRow[$columnName]);
                if($id_now=='header2' || $id_now=='header3'){
                    $worksheet->getStyleByColumnAndRow($columnIndex, $rowNum)->applyFromArray($this->headerStyle);
                }
                
                // Permit only Yes/No values in the "Selected" column.
                if (stripos($columnName, 'Selected') !== FALSE) {
                    
                    if($id_now=='41' || $id_now=='42'){
                        $worksheet->setCellValueByColumnAndRow($columnIndex, $rowNum, '');
                    }
                    $objValidation = $worksheet->getCellByColumnAndRow($columnIndex, $rowNum)->getDataValidation();
                    $objValidation->setType(PHPExcel_Cell_DataValidation::TYPE_LIST)
                        ->setAllowBlank(false)
                        ->setShowInputMessage(true)
                        ->setShowErrorMessage(true)
                        ->setShowDropDown(true)
                        ->setErrorTitle('Input error')
                        ->setError('Please enter either ' . self::YES . ' or ' . self::NO)
                        ->setPromptTitle('Pick a value from the list')
                        ->setFormula1('"' . self::YES . ',' . self::NO . '"');
                }
            }
            $rowNum++;
        }
        $worksheet->freezePaneByColumnAndRow(self::SPREADSHEET_START_ROW, 2);
    }

    private function createSpreadsheet($columnsToAppear, $data)
    {
        $worksheet = $this->objPHPExcel->getActiveSheet();

        $this->setColumnHeaders($worksheet, $columnsToAppear);
        $this->fillRows($worksheet, $columnsToAppear, $data);
    }

    public function getFileName()
    {
        $objWriter = PHPExcel_IOFactory::createWriter($this->objPHPExcel, 'Excel5');
        $excelFilename = FeedValUtil::createTemporaryFileWithExtension('xls');
        $objWriter->save($excelFilename);

        return str_replace($_SERVER['DOCUMENT_ROOT'], '', $excelFilename);
    }
}

