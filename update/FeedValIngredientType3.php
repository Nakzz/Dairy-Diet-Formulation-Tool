<?php

/**
 * Prices for these ingredients are reported by Ken Barnett.
 */

abstract class FeedValIngredientType3 extends FeedValIngredient {

    const UNIT_REGEX = '/Price\s*\(\$\/(.*?)\)/i';

    /**
     * Gets the cell in the price table that contains the price for this ingredient.
     * @return PriceCell the price cell.
     */
    protected abstract function getPriceCell();

    /**
     * Resets the prices of this ingredient.
     */
    public function refetchPrices()
    {
        $this->deletePrices();
        $this->recordTodaysPrice();
    }

    /**
     * Records today's price of this ingredient.
     */
    public function recordTodaysPrice()
    {
        $domDocument = $this->getHTMLDomDocument();
        $priceTable = $this->getPriceTable($domDocument);
        $unit = $this->getUnit($priceTable);
        $price = $this->getPrice($priceTable);
        if (!is_numeric($price)) {
            throw new RuntimeException("Price - $price - is not a number.");
        }
        $this->insertTodaysPrice($price, $unit);
    }

    /**
     * Record price for a specific date.
     * @param string $date
     */
    public function refetchPriceForDate($date)
    {
        $dateObject = new DateTime($date);
        $todaysDate = new DateTime('now');
        if (strcmp($dateObject->format('Y-m-d'), $todaysDate->format('Y-m-d')) == 0) {
            $this->recordTodaysPrice();
        } else {
            echo "[INFO] This operation is not supported for this ingredient due to unavailability of historical prices.";
        }
    }

    /**
     * Gets the price from the price table.
     * @param DOMNode $priceTable the price table.
     *
     * @return double the price.
     */
    private function getPrice($priceTable)
    {
        //Look for GoodQualityHay
	$findme   = 'Prime';
	$pos = strpos($priceTable, $findme);

	if($pos)
	{
		$rest = substr($priceTable,$pos,100);
		$findme ='Large Square ';
		$pos2 = strpos($rest, $findme);
		$number_length = 6;
		$price = substr($rest,$pos2+strlen($findme),$number_length);
	}

	$price = preg_replace('/\s+/', '', $price);
	$price = substr($price,1);
        return $price;
    }

    /*//Original Implementation
    private function getPrice($priceTable)
    {
        $priceCell = $this->getPriceCell();
        $rowNum = $priceCell->getRowNum();
        $colNum = $priceCell->getColNum();

        $rows = $priceTable->getElementsByTagName('tr');
        $priceRow = $rows->item($rowNum);

        $cells = $priceRow->getElementsByTagName('td');
        $cell = $cells->item($colNum);

        $ps = $cell->getElementsByTagName('p');
        $p = $ps->item(0);

        $price = $p->textContent;

        return $price;
    }*/




    /**
     * Gets the unit from the price table.
     * @param DOMNode $priceTable the price table.
     *
     * @return string the unit
     */
    private function getUnit($priceTable)
    {
	$matched = preg_match(self::UNIT_REGEX, $priceTable, $matches);
	if ($matched) {
                $unit = $matches[1];
                return $unit;
            }
	
	return '';

    }

    /*//Original Implementation
    private function getUnit($priceTable)
    {
        $spans = $priceTable->getElementsByTagName('span');
        foreach ($spans as $span) {
            $text = $span->textContent;
            $matched = preg_match(self::UNIT_REGEX, $text, $matches);
            if ($matched) {
                $unit = $matches[1];
                return $unit;
            }
        }

        return '';
    } */
	


    /**
     * Gets the price table.
     * @param DOMDocument $domDocument the HTML document to parse.
     *
     * @return DOMNode the full content of PDF file as string containing the prices.
     *
     * @throws RuntimeException if the prices table is not found.
     */
    private function getPriceTable($domDocument)
    {
        $parser = new \Smalot\PdfParser\Parser();
	//Look for the link to the pdf
        $finder = new DOMXpath($domDocument);

	$domDocument_2 = new DOMDocument();

	$elements = $finder->query('//td/a[1]/@href');
	$count =0;
	if (!is_null($elements)) {
  		foreach ($elements as $element) {
    		     $nodes = $element->childNodes;
    			foreach ($nodes as $node) {
        		if ($count ==0 ){ 
				$url_file =  $node->nodeValue;
			
			  	
			        $domDocument_2->loadHTMLFile($url_file);
				if (!$domDocument_2) {
            				throw new RuntimeException("Cannot open URL ");
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
	
				// Parse pdf file and build necessary objects.
        			$pdf    = $parser->parseFile($url_file); 
        			$table = $pdf->getText(); 
				return $table; 
        		}
			$count++;
        		}
  		}
	
	}
	else 	{
		throw new RuntimeException("Prices table not found.");	
      	}
	
        return '';
	
    }
    
    /*//Original Implementation
    private function getPriceTable($domDocument)
    {
        $domDocument->getElementsByTagName('table');
        $finder = new DOMXPath($domDocument);
        $className = 'MsoNormalTable';
        $nodes = $finder->query("//*[contains(concat(' ', normalize-space(@class), ' '), ' $className ')]");
        if ($nodes->length == 0) {
            throw new RuntimeException("Prices table not found.");
        }
        $table = $nodes->item(0);

        return $table;
        
    }*/



    private function getHTMLDomDocument()
    {
        $domDocument = new DOMDocument();
        $domDocument->loadHTMLFile($this->url);
        if (!$domDocument) {
            throw new RuntimeException("Cannot open URL " . $this->url);
        }
        return $domDocument;
    }
}

/*
class PriceCell {
    private $rowNum;
    private $colNum;
*/
    /**
     * Constructs a new cell.
     * @param integer $rowNum the row number of the cell.
     * @param integer $colNum the column number of the cell.
     */
/*
    public function __construct($rowNum, $colNum) {
        $this->rowNum = $rowNum;
        $this->colNum = $colNum;
    }

    public function getRowNum() {
        return $this->rowNum;
    }

    public function getColNum() {
        return $this->colNum;
    }
}
*/

