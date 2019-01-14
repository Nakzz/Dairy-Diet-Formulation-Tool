<?php
 
// Include Composer autoloader if not already done.
include 'vendor/autoload.php';
 
//Download the right file based in the WebSite URL
$file = "http://fyi.uwex.edu/forage/h-m-r/";
$domDocument = new DOMDocument();
$domDocument->loadHTMLFile($file);
if (!$domDocument) {
            //throw new RuntimeException("Cannot open URL " . $this->url);
	    echo("Cannot open URL");
}


$finder = new DOMXpath($domDocument);
// example 2: for node data in a selected id
//$elements = $xpath->query("/html/body/div[@id='contentwide']");
//$elements = $xpath->query("*/div[@id='contentwide']");
//$elements = $xpath->query("//*[@id]");
$elements = $finder->query('//td/a[1]/@href');

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




//Download the right file based in the WebSite URL
$domDocument_2 = new DOMDocument();
$domDocument_2->loadHTMLFile($url_file);
if (!$domDocument_2) {
            //throw new RuntimeException("Cannot open URL " . $this->url);
            echo("Cannot open URL");
}


$finder_2 = new DOMXpath($domDocument_2);
$elements_2 = $finder_2->query("//p[@class='attachment']/a[1]/@href");

$count_2 =0;
if (!is_null($elements_2)) {
  foreach ($elements_2 as $element) {
    $nodes = $element->childNodes;
    foreach ($nodes as $node) {
        if ($count_2 ==0 ) 
		$url_file =  $node->nodeValue;
        $count_2++;
        }
  }
}


//echo $url_file_2



// Parse pdf file and build necessary objects.
$parser = new \Smalot\PdfParser\Parser();
$pdf    = $parser->parseFile($url_file);
 
$text = $pdf->getText();

//Look for GoodQualityHay
$findme   = 'Prime (>';
$pos = strpos($text, $findme);

if($pos)
{

$rest = substr($text,$pos,100);
$findme ='Large Square ';
$pos2 = strpos($rest, $findme);
$number_length = 6;
$result = substr($rest,$pos2+strlen($findme),$number_length);
}

$result = preg_replace('/\s+/', '', $result);
$result = substr($result,1);
echo $result;


/*
if(!is_numeric($result)) echo "Is not numeric";
else print $result;

//Look for Unit

$UNIT_REGEX = '/Price\s*\(\$\/(.*?)\)/i';
$matched = preg_match($UNIT_REGEX, $text, $matches);
if ($matched) {
                $unit = $matches[1];
                echo $unit;
            }
*/

?>
