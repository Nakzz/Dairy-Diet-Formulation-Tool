<?php


/**
 * Prices for these type of ingredients can be extracted from http://future.aae.wisc.edu/tab/feed.html#93.
 */
class FeedValIngredientType1 extends FeedValIngredient
{

    /**
     * Resets the prices of this ingredient. First, all prices corresponding to this
     * ingredient in the PRICES table are removed. Then, prices from the first available
     * date are fetched and updated.
     */
    public function refetchPrices()
    {
        $this->deletePrices();

        $currentYear = date('Y');
        for ($year = FeedValDatabase::START_YEAR; $year <= $currentYear; $year++) {
            $datePriceUnits = $this->getPricesForYear($year);
            $date = $this->getStartDate($year, $datePriceUnits);
            $endDate = $this->getEndDate($year, $datePriceUnits);

            for (; $date <= $endDate; $date->add(new DateInterval(self::ONE_DAY_INTERVAL))) {
                if ($this->priceWasUpdatedOnDate($date, $datePriceUnits)) {
                    $datePriceUnit = $this->extractPriceOnDate($date, $datePriceUnits);
                }
                $price = $datePriceUnit->getPrice();
                $unit = $datePriceUnit->getUnit();

                $this->insertPrice($date->format('Y-m-d'), $price, $unit);
            }
        }
    }

    /**
     * Gets the price on the supplied date.
     *
     * @param DateTime $date the date.
     * @param DatePriceUnit[] $datePriceUnits all the prices available for the year.
     *
     * @return DatePriceUnit the price and unit on the given date.
     */
    private function extractPriceOnDate($date, $datePriceUnits)
    {
        $priceOnDate = NULL;
        foreach ($datePriceUnits as $datePriceUnit) {
            if ($date == new DateTime($datePriceUnit->getDate())) {
                $priceOnDate = $datePriceUnit;
            }
        }

        return $priceOnDate;
    }

    /**
     * Checks if the price was updated on the given date.
     *
     * @param DateTime $date the date.
     * @param DatePriceUnit[] $datePriceUnits all the prices available for the year.
     *
     * @return boolean true if the price was updated on the given date, false otherwise.
     */
    private function priceWasUpdatedOnDate($date, $datePriceUnits)
    {
        foreach ($datePriceUnits as $datePriceUnit) {
            if ($date == new DateTime($datePriceUnit->getDate())) {
                return TRUE;
            }
        }

        return FALSE;
    }

    /**
     * If the supplied year is the current year, the end date is the current date. Else,
     * the end date is the last day of the supplied year.
     *
     * @param integer $year the year.
     * @param DatePriceUnit[] $datePriceUnits all the prices available for the year.
     *
     * @return DateTime the end date.
     */
    private function getEndDate($year, $datePriceUnits)
    {
        if ($year == date('Y')) {
            $endDate = new DateTime("now");
        } else {
            $endDate = new DateTime($year . '-12-31');
        }

        return $endDate;
    }

    /**
     * If the supplied year is the start year, the start date is the date a price first
     * became available. Else, the start date is the first day of the supplied year.
     *
     * @param integer $year the year.
     * @param DatePriceUnit[] $datePriceUnits all the prices available for the year.
     *
     * @return DateTime the start date.
     */
    private function getStartDate($year, $datePriceUnits)
    {
        if ($year == FeedValDatabase::START_YEAR) {
            $startDate = new DateTime($datePriceUnits[0]->getDate());
        } else {
            $startDate = new DateTime($year . '-01-01');
        }

        return $startDate;
    }

    /**
     * Gets the first available price for the supplied year.
     *
     * @param integer $year the year.
     *
     * @return DatePriceUnit the first available price.
     */
    private function getFirstPriceForYear($year)
    {
        $prices = $this->getPricesForYear($year);
        return $prices[0];
    }

    /**
     * Get all the prices for a specific year.
     * @param integer $year the year to fetch the prices for.
     *
     * @return DatePriceUnit[] the array of prices.
     */
    private function getPricesForYear($year)
    {
        $lines = $this->getFileContents($year);
        $prices = $this->getPrices($lines);

        return $prices;
    }

    /**
     * Gets the next date. If the array contains a date at index $i+1, it is returned.
     * Otherwise, tomorrow's date is returned.
     * @param DatePriceUnit[] $prices the prices.
     * @param integer $i the index to check at.
     *
     * @return DateTime the next date.
     */
    private function getNextDateObject($prices, $i)
    {
        if (isset($prices[$i + 1])) {
            return new DateTime($prices[$i + 1]->getDate());
        }

        return new DateTime('tomorrow');
    }

    /**
     * Gets the prices from the price table. This is the price table with the first
     * two rows and the week column removed.
     *
     * @param array $lines the price table.
     *
     * @return array the prices array. The keys are the dates and the values are the
     * corresponding prices.
     */
    private function getPrices($lines)
    {
        $prices = array();
        $currency = $this->getCurrency($lines);

        // The first row contains the units and currency.
        $firstRow = array_shift($lines);
        $unit = $this->getUnit($firstRow);

        // The second row contains column headers.
        array_shift($lines);

        foreach ($lines as $line) {
            $cells = explode(',', $line);
            $date = $cells[1];
            $price = self::getPriceInDollars($cells[2], $currency);
            $prices[] = new DatePriceUnit($date, $price, $unit);
        }

        return $prices;
    }

    /**
     * Gets the currency from the price table. The currency is in the first row.
     *
     * @param array $lines the price table.
     *
     * @return string the currency.
     */
    private function getCurrency($lines)
    {
        $firstRow = $lines[0];
        $extractedCurrency = $this->extractCurrency($firstRow);
        if (strcasecmp($extractedCurrency, self::CENTS) == 0) {
            return self::CENTS;
        } else {
            return self::DOLLARS;
        }
    }

    /**
     * Gets the units from the price table. The units are in the first row.
     *
     * @param string $row the row in the price table containing the unit.
     *
     * @return string the units.
     */
    private function getUnit($row)
    {
        $extractedUnit = $this->extractUnits($row);
        $unit = $this->getUnitInDatabaseForm($extractedUnit);

        return $unit;
    }

    /**
     * Gets the price table for the ingredient for the specified year. The price table
     * is the CSV file available for download on the ingredient's page parsed into an
     * array.
     *
     * @param integer $year the year to get the prices for.
     *
     * @return array an array created by parsing the CSV file.
     *
     * @throws RuntimeException if the URL cannot be accessed.
     */
    private function getFileContents($year)
    {
        $csvUrl = $this->getCsvUrl($year);
        $fileContents = file($csvUrl, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$fileContents) {
            throw new RuntimeException("Cannot open URL $csvUrl");
        }

        return $fileContents;
    }

    /**
     * Gets current year prices.
     *
     * @return DatePriceUnit[] the prices for the supplied year.
     */
    private function getPricesForCurrentYear()
    {
        $currentYear = date('Y');
        return $this->getPricesForYear($currentYear);
    }

    /**
     * Record price for a specific date.
     * @param string $date
     */
    public function refetchPriceForDate($date)
    {
        $dateObject = new DateTime($date);
        $priceOnDate = $this->getPriceOnDate($dateObject);
        $this->insertPrice($date, $priceOnDate->getPrice(), $priceOnDate->getUnit());
    }

    /**
     * Gets the price on the given date.
     * @param DateTime $date
     * @return DatePriceUnit the price and unit on the given date.
     */
    private function getPriceOnDate($date)
    {
        $priceOnDate = NULL;
        $year = $date->format('Y');

        while (is_null($priceOnDate) && $year >= FeedValDatabase::START_YEAR) {
            $prices = array_reverse($this->getPricesForYear($year));
            foreach ($prices as $price) {
                if ($date < new DateTime($price->getDate())) {
                    continue;
                }
                $priceOnDate = $price;
                break;
            }
            $year -= 1;
        }

        return $priceOnDate;
    }


    /**
     * Records today's price of this ingredient.
     */
    public function recordTodaysPrice()
    {
        $todaysDate = new DateTime('now');
        $todaysPrice = $this->getPriceOnDate($todaysDate);
        $this->insertTodaysPrice($todaysPrice->getPrice(), $todaysPrice->getUnit());
    }

    /**
     * Checks if the supplied date is in the future.
     *
     * @param string $date the date.
     * @return boolean true if the date is in the future, false otherwise.
     */
    private function isFutureDate($date)
    {
        $currentDate = new DateTime("now");
        $suppliedDate = new DateTime($date);
        if ($suppliedDate > $currentDate) {
            return TRUE;
        }

        return FALSE;
    }

    /**
     * Gets the latest price available at the source.
     */
    private function getLatestPrice()
    {
        $currentYear = date('Y');
        $lines = $this->getFileContents($currentYear);
        $prices = $this->getPrices($lines);

        return end($prices);
    }

    /**
     * Extracts the units from the first line of the CSV file.
     *
     * @param string $firstRow The first row of the CSV file.
     *
     * @return string The units.
     */
    private function extractUnits($firstRow)
    {
        $slashPosition = strrpos($firstRow, '/');
        $units = trim(substr($firstRow, $slashPosition + 1));

        return $units;
    }

    /**
     * Extracts the currency form the first line of the CSV file.
     *
     * @param string $firstRow the first row of the CSV file.
     *
     * @return string the currency.
     * @throws RuntimeException when the currency is not found in the CSV file.
     */
    private function extractCurrency($firstRow)
    {
        $found = preg_match('/(\$|cents)\/\S+\s*?\z/i', $firstRow, $matches);
        if ($found === 0) {
            throw new RuntimeException("Currency not found in CSV file.");
        }
        $currency = $matches[1];

        return $currency;
    }

    /**
     * Creates the CSV URL from the URL stored in the database.
     *
     * @param int $year The year to get the URL for.
     *
     * @return string The CSV URL.
     */
    private function getCsvUrl($year)
    {
        $queryParams = array('duration' => 1, 'year' => $year, 'area' => $this->city);
        $csvUrl = $this->url . '.csv?' . http_build_query($queryParams, '', '&');
        return $csvUrl;
    }

}