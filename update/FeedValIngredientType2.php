<?php

/**
 * Prices for these ingredients are reported by Ken Barnett.
 */

abstract class FeedValIngredientType2 extends FeedValIngredient {

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
    }

    /**
     * Gets the unit from the price table.
     * @param DOMNode $priceTable the price table.
     *
     * @return string the unit
     */
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
    }

    /**
     * Gets the price table.
     * @param DOMDocument $domDocument the HTML document to parse.
     *
     * @return DOMNode the table containing the prices.
     *
     * @throws RuntimeException if the prices table is not found.
     */
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
    }

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

class PriceCell {
    private $rowNum;
    private $colNum;

    /**
     * Constructs a new cell.
     * @param integer $rowNum the row number of the cell.
     * @param integer $colNum the column number of the cell.
     */
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


