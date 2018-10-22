<?php

/**
 * This script deals with AJAX calls from the client. The client may request for the current grid to be downloaded as
 * an Excel spreadsheet, a spreadsheet to be uploaded for analysis, or simply load the tool.
 *
 * If a spreadsheet is being posted to the server, parse it and create the XML required to display the grid. If other
 * data is being posted to the server, create a spreadsheet containing that data and send it for download. Else, create
 * the XML required to display the grid.
 */

include 'chromePhp.php';
ChromePhp::log('Debugging logging started');



if(isset($_GET['tip']) or isset($_POST['tip'])){
    require_once 'utils/FeedValAJAXAutoloadcalc.php';
}else{
    require_once 'utils/FeedValAJAXAutoload.php';
}

include_once 'update/automaticPriceUpdate.php';


if (isset($_POST['data']) && isset($_POST['minimize'])) {
    // Decode the JSON encoded data.
    if (get_magic_quotes_gpc()) {
        $cleanData = stripslashes($_POST['data']);
        $cleanColumnsToAppear = stripslashes($_POST['columnsToAppear']);
    } else {
        $cleanData = $_POST['data'];
        $cleanColumnsToAppear = $_POST['columnsToAppear'];
    }
    $data = json_decode($cleanData, TRUE);
    $columnsToAppear = json_decode($cleanColumnsToAppear, TRUE);
    $minimization = FeedValMinimizationFactory::getCoefficients($columnsToAppear, $data);
    
    $minimizationArray = $minimization->getMinArray();

    echo json_encode($minimizationArray);

} else if (isset($_POST['data'])) {

    // Decode the JSON encoded data.
    if (get_magic_quotes_gpc()) {
        $cleanData = stripslashes($_POST['data']);
        $cleanColumnsToAppear = stripslashes($_POST['columnsToAppear']);
    } else {
        $cleanData = $_POST['data'];
        $cleanColumnsToAppear = $_POST['columnsToAppear'];
    }
    $data = json_decode($cleanData, TRUE);
    $columnsToAppear = json_decode($cleanColumnsToAppear, TRUE);

    // Create the Excel spreadsheet and push it for download.
    $spreadsheet = FeedValSpreadsheetFactory::createSpreadsheet($columnsToAppear, $data);
    $spreadsheetFileName = $spreadsheet->getFileName();

    echo json_encode(array('spreadsheetFilename' => $spreadsheetFileName));


} else if (isset($_GET['getMinMaxDates'])) {
    $databaseDao = new FeedValDatabaseDao();
    $minDate = $databaseDao->getMinDate();
    $maxDate = $databaseDao->getMaxDate();
    $dates = array('minDate' => $minDate, 'maxDate' => $maxDate);

    echo json_encode($dates);

} else if (isset($_GET['pricesForDate'])) {
    $databaseDao = new FeedValDatabaseDao();
    $prices = $databaseDao->getPricesForDate($_GET['pricesForDate']);

    echo json_encode($prices);

} else if (isset($_POST['convertUnits'])){
    $ingredients = $_POST['ingredients'];
    $convertedUnits = array();
    foreach ($ingredients as $ingredient) {
        $ingredientName = $ingredient['ingredientName'];
        $ingredientID = intval($ingredient['ingredientID']);
        $price = $ingredient['price'];
        $fromUnit = isset($ingredient['fromUnit'])?$ingredient['fromUnit']:'ton';
        $toUnit = isset($ingredient['toUnit'])?$ingredient['toUnit']:'ton';
        if ($fromUnit && $price && $toUnit){
            $convertedUnits[$ingredientID] = UnitConverter::getPriceInUnit($ingredientName, $price, $fromUnit, $toUnit);
        }
    }
    echo json_encode($convertedUnits);

}else{

    if (isset($_POST['data_file_submit_calc'])){
        $userFile = FeedValUtil::uploadFile($_FILES['data_file_calc']);
        $feedValXML = new FeedValSpreadsheetXML($userFile);
        
    } else if (isset($_POST['data_file_submit'])) {
        //$userFile = FeedValUtil::uploadFile($_FILES['data_file']);
        $userFile = FeedValUtils::uploadFile($_FILES['data_file']);


        $feedValXML = new FeedValSpreadsheetXML($userFile);
    }else{
        $feedValXML = new FeedValDatabaseXML();
    }

    $xmlDoc = $feedValXML->getXML();
    $jqGridSettings = $feedValXML->getJqGridSettings();
    $nutrients = $feedValXML->getNutrients();

    $xmlFile = FeedValUtil::createTemporaryFileWithExtension('xml');
    
    $xmlDoc->save($xmlFile);
    $jqGridSettings['url'] = getXMLFilePath($xmlFile);
    $jsonArray = array(
        'jqGridOptions' => $jqGridSettings,
        'nutrients' => $nutrients);
    echo json_encode($jsonArray);
}

function getXMLFilePath($xmlFile) {
    $server_path = str_replace('/', DIRECTORY_SEPARATOR, $_SERVER['DOCUMENT_ROOT']);
    return str_replace($server_path, '', $xmlFile);
}

?>