<?php


class FixedPriceType extends FeedValIngredient {

    const DATA_DIV_ID = 'data';
    const UNIT_REGEX = '/<strong>\s*?Units\s*?:\s*?<\/strong>\s*?\$\/(\S*?)\s*?<br>/i';
    const FIRST_DAY_OF_MONTH = 1;
    private $fixed_prices = array(136.07,
329,
317,
471.97,
321.67,
518.1,
187,
81,
38.1,
93.79,
100,
127.26,
0.5,
1100,
472,
28.08,
145,
100,
260,
0,
249,
90,
221,
396.36,
157.92,
297,
87.78,
246.44,
165,
150,
90,
345,
177.5,
535,
112.32,
185.63,
130,
400,
132,
34.56);


    private $overwriteStatement;

    public function __construct($db, $id, $name, $url, $city)
    {
        parent::__construct($db, $id, $name, $url, $city);
        $this->overwriteStatement = $this->getPreparedOverwriteStatement();
    }

    /**
     * Gets the prepared insert statement.
     *
     * @return PDOStatement the prepared statement.
     */
    private function getPreparedOverwriteStatement()
    {
        $query = 'INSERT INTO ' . FeedValDatabase::TBL_PRICES . ' (INGREDIENT_ID, DATE, PRICE, UNIT) VALUES
        (:id, :date, :price, :unit) ON DUPLICATE KEY UPDATE PRICE=VALUES(PRICE), UNIT=VALUES(UNIT)';
        return $this->db->prepare($query);
    }

    /**
     * Resets the prices of this ingredient. All prices corresponding to this ingredient
     * in the PRICES table are deleted. Depending upon the implementation, prices from the
     * first available date may be fetched and updated.
     */
    public function refetchPrices()
    {
        $this->deletePrices();

        $currentYear = date('Y');
        $price = -1;
        for ($year = FeedValDatabase::START_YEAR; $year <= $currentYear; $year++) {
            $monthlyPrices = $this->getMonthlyPrices($year);
            $unit = $this->getUnitForYear($year);
            $date = $this->getStartDate($year, $monthlyPrices);
            $endDate = $this->getEndDate($year, $monthlyPrices);
            for (; $date <= $endDate; $date->add(new DateInterval(self::ONE_DAY_INTERVAL))) {
                $month = $date->format('n');
                $price = isset($monthlyPrices[$month])? $monthlyPrices[$month] : $price;

                $this->insertPrice($date->format('Y-m-d'), $price, $unit);
            }
        }
    }

    /**
     * Gets the end date. If the given year is the current year, the last date is the current
     * date. Else, the end date is the last date of the year.
     *
     * @param integer $year the year.
     *
     * @return DateTime the end date.
     */

    private function getEndDate($year)
    {
        $endDate = NULL;
        if ($year == date('Y')) {
            $endDate = new DateTime("now");
        } else {
            $endDate = $this->getLastDateOfMonthInYear(12, $year);
        }

        return $endDate;
    }

    /**
     * Gets the start date. If the given year is the year the prices were first posted,
     * the start date is the first date in that year the prices were posted. Else, the
     * start date is the first date of the year.
     *
     * @param integer $year the year.
     * @param array $monthlyPrices the monthly prices for the given year.
     *
     * @return DateTime the start date.
     */
    private function getStartDate($year, $monthlyPrices)
    {
        $startDate = NULL;
        if ($year == FeedValDatabase::START_YEAR) {
            for ($month = 1; $month <= 12; $month++) {
                if (isset($monthlyPrices[$month])) {
                    $startDate = $this->getFirstDateOfMonthInYear($month, $year);
                    break;
                }
            }
        } else {
            $startDate = $this->getFirstDateOfMonthInYear(1, $year);
        }

        return $startDate;
    }

    /**
     * Record price for a specific date. Prices for Raw Soybeans are updated on a
     * monthly basis. If the price for the supplied month has not been posted, the price
     * from the previous month is used. If the price for the supplied month has been posted,
     * all the older prices for the supplied month are overwritten with the latest prices.
     * @param string $date
     */
    public function refetchPriceForDate($date)
    {
        $dateObject = new DateTime($date);
        $year = $dateObject->format('Y');
        $month = $dateObject->format('n');
        $monthlyPrices = $this->getMonthlyPrices($year);
        $unit = $this->getUnitForYear($year);
        if (isset($monthlyPrices[$month])) {
            $this->overwritePrices($month, $year, $monthlyPrices[$month], $unit);
        } else {
            $latestAvailablePrice = $this->getLatestAvailablePrice($month, $year);
            $this->insertPrice($date, $latestAvailablePrice, $unit);
        }
    }



    /**
     * Record price for a specific date. This prices are fixed
     * @param string $date
     */ 
    public function refetchPriceForDateFixed($date)
    {   
        $dateObject = new DateTime($date);
        $year = $dateObject->format('Y');
        $month = $dateObject->format('n');
        $unit = 'ton';
        $ingr_id = $this->id;
        $fixed_price = $this->fixed_prices[$ingr_id-1];//$this->getLatestAvailablePrice($month, $year);
        $this->insertPrice($date, $fixed_price, $unit);
    }





    /**
     * Records today's price of this ingredient. Prices for Raw Soybeans are updated on a
     * monthly basis. If the price for the current month has not been posted, the price
     * from the last month is used. If the price for the current month has been posted,
     * all the older prices for the current month are overwritten with the latest prices.
     */
    public function recordTodaysPrice()
    {
        $todaysDate = new DateTime('now');
        $this->refetchPriceForDateFixed($todaysDate->format('Y-m-d'));
    }

    /**
     * Use the latest available price when the price for the given month is not available.
     *
     * @param integer $forMonth the month.
     * @param integer $forYear the year.
     *
     * @return number the latest available price.
     */
    private function getLatestAvailablePrice($forMonth, $forYear)
    {
        $price = -1;
        $latestPriceFound = FALSE;
        $forDate = $this->getLastDateOfMonthInYear($forMonth, $forYear);
        for ($year = $forYear;
             $year >= FeedValDatabase::START_YEAR && !$latestPriceFound;
             $year--) {
            $monthlyPrices = $this->getMonthlyPrices($year);
            for ($month = 12; $month >= 1 && !$latestPriceFound; $month--) {
                if (isset($monthlyPrices[$month])) {
                    $date = $this->getLastDateOfMonthInYear($month, $year);
                    if ($date <= $forDate) {
                        $price = $monthlyPrices[$month];
                        $latestPriceFound = TRUE;
                    }
                }
            }
        }

        return $price;
    }

    /**
     * Overwrites the given month's prices with the latest prices.
     *
     * @param integer $month the month.
     * @param integer $year the year.
     * @param number $price the price for the month.
     * @param string $unit the unit.
     */
    private function overwritePrices($month, $year, $price, $unit)
    {
        $date = $this->getFirstDateOfMonthInYear($month, $year);
        $endDate = $this->getLastDateOfMonthInYear($month, $year);
        for ( ; $date <= $endDate; $date->add(new DateInterval(self::ONE_DAY_INTERVAL))) {
            $this->overwriteStatement->execute(array(
                ':id'    => $this->id,
                ':date'  => $date->format('Y-m-d'),
                ':price' => $price,
                ':unit'  => $unit
            ));
        }
    }

    /**
     * Gets the prices for the supplied year. Prices at the source are per month.
     * @param integer $year the year to get the prices for.
     *
     * @return array the prices array keyed by month number.
     */
    private function getMonthlyPrices($year)
    {
        $monthlyPrices = array();
        $html = $this->getHtml($year);
        $priceRows = $this->getPriceRows($html);
        foreach ($priceRows as $priceRow) {
            $cells = $priceRow->getElementsByTagName('td');
            $month = $this->getNumericMonth($cells->item(0)->textContent);
            $price = $cells->item(1)->textContent;
            $monthlyPrices[$month] = $price;
        }

        return $monthlyPrices;
    }

    /**
     * Gets the unit of measurement for the supplied year.
     *
     * @param integer $year the year.
     *
     * @return string the units.
     */
    private function getUnitForYear($year)
    {
        $html = $this->getHtml($year);
        $unit = $this->getUnit($html);

        return $unit;
    }

    /**
     * Create a date corresponding to the first day of the month.
     * @param string $month the month in the format Jan, Feb, Mar... Dec.
     * @param integer $year the year.
     *
     * @return DateTime the date.
     */
    private static function getFirstDateOfMonthInYear($month, $year)
    {
        $firstDate = new DateTime();
        $firstDate->setDate($year, $month, self::FIRST_DAY_OF_MONTH);

        return $firstDate;
    }

    /**
     * Gets the last date in the given month, in the given year.
     *
     * @param integer $month the month.
     * @param integer $year the year.
     *
     * @return DateTime the last date.
     */
    private static function getLastDateOfMonthInYear($month, $year)
    {
        $lastDate = new DateTime();
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $lastDate->setDate($year, $month, $daysInMonth);

        return $lastDate;
    }

    /**
     * Gets the numeric month from the abbreviated month.
     * @param string $month the abbreviated month like Jan, Feb, Mar, ... Dec.
     *
     * @return integer the numeric month.
     */
    private static function getNumericMonth($month)
    {
        $date = date_parse($month);
        return $date['month'];
    }

    /**
     * Extracts and returns the unit from the HTML DOM.
     * @param DOMDocument $html the HTML page.
     *
     * @return string the unit.
     *
     * @throws RuntimeException if the unit is not found in the HTML file.
     */
    private function getUnit($html)
    {
        $text = $html->saveHTML();
        $matched = preg_match(self::UNIT_REGEX, $text, $matches);
        if ($matched !== 1) {
            throw new RuntimeException("Unit not found in HTML file.");
        }
        $unit = $this->getUnitInDatabaseForm($matches[1]);

        return $unit;
    }

    private function getPriceRows($html)
    {
        $priceRows = array();
        $dataDiv = $html->getElementById(self::DATA_DIV_ID);
        $pricesTable = $this->getPricesTable($dataDiv);
        $tableRows = $pricesTable->getElementsByTagName('tr');
        for ($i = 1; $i < $tableRows->length; $i++) {
            $priceRows[] = $tableRows->item($i);
        }

        return $priceRows;
    }

    private function getPricesTable($dataDiv)
    {
        $pricesTables = $dataDiv->getElementsByTagName('table');
        $pricesTable = $pricesTables->item(0);

        return $pricesTable;
    }

    private function getHtml($year)
    {
        $url = $this->getUrl($year);
        $domDocument = new DOMDocument('1.0', 'utf-8');
        $fileLoaded = $domDocument->loadHTMLFile($url);
        if (!$fileLoaded) {
           throw new RuntimeException("Cannot open URL $url");
        }

        return $domDocument;
    }

    private function getUrl($year)
    {
        $queryParams = array('area' => $this->city, 'year' => $year);
        $url = $this->url . '?' . http_build_query($queryParams, '', '&');

        return $url;
    }

}
