<?php
 
// Include Composer autoloader if not already done.
include 'vendor/autoload.php';
 
// Parse pdf file and build necessary objects.
$parser = new \Smalot\PdfParser\Parser();
$pdf    = $parser->parseFile('/srv/www/dev.dairymanagement.wisc.edu/oldtools/feedval_12_v2/pdfparser/document.pdf');
 
$text = $pdf->getText();
echo $text;
 
?>
