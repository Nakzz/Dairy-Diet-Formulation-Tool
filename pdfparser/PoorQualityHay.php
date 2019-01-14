<?php
 
// Include Composer autoloader if not already done.
include 'vendor/autoload.php';
 
//Download the right file based in the WebSite URL
$file = "http://fyi.uwex.edu/forage/h-m-r/";
$doc = new DOMDocument();
$doc->loadHTMLFile($file);

$xpath = new DOMXpath($doc);
// example 2: for node data in a selected id
//$elements = $xpath->query("/html/body/div[@id='contentwide']");
//$elements = $xpath->query("*/div[@id='contentwide']");
//$elements = $xpath->query("//*[@id]");
$elements = $xpath->query('//td/a[1]/@href');

$count =0;
if (!is_null($elements)) {
  foreach ($elements as $element) {
    //echo "<br/>[". $element->nodeName. "]";

    $nodes = $element->childNodes;
    foreach ($nodes as $node) {
        //echo $node->getAttribute("href") "\n";
	if ($count ==0 ) $url_file =  $node->nodeValue;
    	//print $node->nodeValue." - ".$node->getAttribute("href")."<br/>";
	$count++;
	}
  }
}

//echo $url_file;
//Changes for new link April 30, 2015
$file = $url_file;
$doc = new DOMDocument();
$doc->loadHTMLFile($file);

$xpath = new DOMXpath($doc);
$elements = $xpath->query('//p[@class="attachment"]/a[1]/@href');

if (!is_null($elements)) {
  foreach ($elements as $element) {
        $url_file =  $element->nodeValue;
  }
}

// Parse pdf file and build necessary objects.
$parser = new \Smalot\PdfParser\Parser();
$pdf    = $parser->parseFile($url_file);
 
$text = $pdf->getText();

//Look for GoodQualityHay
$findme   = 'Prime';
$pos = strpos($text, $findme);

if($pos)
{

$rest = substr($text,$pos,100);
$findme ='Large Square ';
$pos2 = strpos($rest, $findme);
$number_length = 6;
$result = substr($rest,$pos2+strlen($findme),$number_length);
}

echo $result;


//Look for PoorQualityHay
$findme2   = 'Grade 2';
$pos2= strpos($text, $findme2);


if($pos2)
{
$rest2 = substr($text,$pos2,100);
$findme2 ='Large Square ';
$posPoor = strpos($rest2, $findme2);
$number_length = 6;
$resultPoor = substr($rest2,$posPoor+strlen($findme2),$number_length);


}

echo $resultPoor;

?>
