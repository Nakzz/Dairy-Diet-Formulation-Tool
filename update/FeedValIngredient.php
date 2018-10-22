<?php

abstract class FeedValIngredient {
    protected $db;
    protected $id;
    protected $name;
    protected $url;
    protected $city;

    private $insertStatement;
    private $deleteStatement;

    const DOLLARS = '$';
    const CENTS = 'cents';
    const NUM_CENTS_IN_ONE_DOLLAR = 100;
    const ONE_DAY_INTERVAL = 'P1D';
    const ONE_MONTH_INTERVAL = 'P1M';

    /**
     * Constructs a new ingredient object.
     * @param PDO $db database connection object.
     * @param integer $id ingredient id.
     * @param string $name ingredient name.
     * @param string $url the url to fetch prices from.
     * @param string $city the city whose prices are used for this ingredient.
     */
    public function __construct($db, $id, $name, $url, $city) {
        $this -> db = $db;
        $this -> id = $id;
        $this -> name = $name;
        $this -> url = $url;
        $this -> city = $city;

        $this->insertStatement = $this->getPreparedInsertStatement();
        $this->deleteStatement = $this->getPreparedDeleteStatement();
    }

    private function getPreparedDeleteStatement()
    {
        $query = 'DELETE FROM ' . FeedValDatabase::TBL_PRICES . ' WHERE INGREDIENT_ID = :id';
        return $this->db->prepare($query);
    }


    /**
     * Resets the prices of this ingredient. All prices corresponding to this ingredient
     * in the PRICES table are deleted. Depending upon the implementation, prices from the
     * first available date may be fetched and updated.
     */
    abstract public function refetchPrices();

    /**
     * Records today's price of this ingredient.
     */
    abstract public function recordTodaysPrice();

    public final function getName() {
        return $this->name;
    }

    /**
     * Record price for a specific date.
     * @param string $date
     */
    public abstract function refetchPriceForDate($date);

    /**
     * Deletes all prices for this ingredient from the database.
     */
    protected final function deletePrices() {
        $this->deleteStatement->execute(array(':id' => $this->id));
    }

    /**
     * Inserts the prices into the database table.
     * @param double $price the price.
     * @param string $unit the unit.
     */
    protected final function insertTodaysPrice($price, $unit) {
        $date = date('Y-m-d');
        $this->insertPrice($date, $price, $unit);
    }

    /**
     * Inserts the prices into the database table.
     * @param string $date the date.
     * @param double $price the price.
     * @param string $unit the unit.
     */
    protected final function insertPrice($date, $price, $unit)
    {
        $this->insertStatement->execute(array(':id' => $this->id, ':date' => $date, ':price' => $price, ':unit' => $unit));
    }

    private function getPreparedInsertStatement()
    {
        $query = 'INSERT INTO ' . FeedValDatabase::TBL_PRICES . ' (INGREDIENT_ID, DATE, PRICE, UNIT) VALUES
        (:id, :date, :price, :unit) ON DUPLICATE KEY UPDATE PRICE=VALUES(PRICE), UNIT=VALUES(UNIT)';
        return $this->db->prepare($query);
    }

    protected final function getPriceInDollars($price, $currency)
    {
        if (strcasecmp($currency, self::DOLLARS) == 0) {
            return $price;
        } else {
            return $price / self::NUM_CENTS_IN_ONE_DOLLAR;
        }
    }

    /**
     * Gets the unit as it is stored in the database.
     * @param string $extractedUnit the unit extracted from the source.
     *
     * @return string the unit as it is stored in the database.
     */
    protected function getUnitInDatabaseForm($extractedUnit)
    {
        if (preg_match(FeedValDatabase::BU_REGEX, $extractedUnit)) {
            $unit = FeedValDatabase::BU;
        } else if (preg_match(FeedValDatabase::TON_REGEX, $extractedUnit)) {
            $unit = FeedValDatabase::TON;
        } else if (preg_match(FeedValDatabase::LB_REGEX, $extractedUnit)) {
            $unit = FeedValDatabase::LB;
        } else {
            $unit = FeedValDatabase::CWT;
        }

        return $unit;
    }


}