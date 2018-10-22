<?php

class FeedValAJAXAutoload {

    public static function autoload()
    {
        require_once $_SERVER['DOCUMENT_ROOT'] . '/php/PHPExcel/Classes/PHPExcel/IOFactory.php';
        require_once 'factory/DatabaseConnectionFactory.php';
        require_once 'daos/FeedValDao.php';
        require_once 'daos/FeedValDatabaseDao.php';
        require_once 'daos/FeedValSpreadsheetDao.php';
        require_once 'jqgrid_xml/FeedValXML.php';
        require_once 'jqgrid_xml/FeedValSpreadsheetXML.php';
        require_once 'jqgrid_xml/FeedValDatabaseXML.php';
        require_once 'factory/FeedValSpreadsheetFactory.php';
        require_once 'factory/FeedValSpreadsheet.php';
        require_once 'utils/FeedValFileUtil.php';
        require_once 'utils/UnitConverter.php';
	require_once 'factory/FeedValMinimizationFactory.php';
	require_once 'factory/FeedValMinimization.php';
    }

}

spl_autoload_register('FeedValAJAXAutoload::autoload');
