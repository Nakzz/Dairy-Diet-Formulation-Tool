<?php

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class FeedValDatabase
{

    /**
     * Database credentials
     */
    const DB_HOST = 'localhost';
    const DB_USER = 'dairymgt';
    const DB_NAME = 'dietformulation';
    const DB_PASSWORD = '10@(Dairymgt#@!1';

    /**
     * Database tables.
     */
    const TBL_INGREDIENTS = 'ingredients';
    const TBL_PRICES = 'prices';

    /**
     * Columns.
     */
    const COL_INGREDIENT_ID = 'INGREDIENT_ID';

    /**
     * Units and their regex patterns.
     */
    const BU = 'bu';
    const TON = 'ton';
    const CWT = 'cwt';
    const LB = 'lb';
    const BU_REGEX = '/bu/i';
    const TON_REGEX = '/ton/i';
    const CWT_REGEX = '/cwt/i';
    const LB_REGEX = '/lb/i';

    private $feedValIngredientAspect;
    private $databaseConnectionFactoryIndex;
    private $feedValIngredientType1Aspect;
    private $rawSoybeanAspect;
    private $fixedPriceAspect;
    /**
     * The year in which the data collection started.
     */
    const START_YEAR = 2013;

    public function __construct()
    {
        $this->feedValIngredientAspect = new FeedValIngredientAspect();
        $this->databaseConnectionFactoryIndex = new DatabaseConnectionFactoryAspect();
        $this->feedValIngredientType1Aspect = new FeedValIngredientType1Aspect();
        $this->rawSoybeanAspect = new RawSoybeanAspect();
        //$this->fixedPriceAspect = new FixedPriceAspect();
    }

    /**
     * Records today's prices for all update-able ingredients.
     */
    public static function recordTodaysPrices() {
        $db = FeedValDatabaseConnectionFactory::getConnection();

        // Update all the update-able ingredients in the database.
        $ingredients = self::getUpdatableIngredients($db);
        foreach ($ingredients as $ingredient) {
            $db->beginTransaction();
            try {
                $ingredient->recordTodaysPrice();
            } catch (Exception $ex) {
                echo $ex->getMessage();
            }

            $db->commit();
        }

    }

    /**
     * Resets the PRICES table of the database.
     */
    public static function resetPrices() {
        $db = FeedValDatabaseConnectionFactory::getConnection();

        $ingredients = self::getUpdatableIngredients($db);
        foreach ($ingredients as $ingredient) {
            $db->beginTransaction();
            try {
                $ingredient->refetchPrices();
            } catch (Exception $ex) {
                echo $ex->getMessage();
            }
            $db->commit();
        }
    }

    /**
     * Gets the update-able ingredients.
     *
     * @param PDO $db a connection to the database.
     * @return array an array of ingredient objects.
     *
     */
    private static function getUpdatableIngredients($db) {
        $ingredients = array();

        $query = 'SELECT INGREDIENT_ID, INGREDIENT, URL, CITY, CLASS FROM ' . self::TBL_INGREDIENTS . ' WHERE CLASS IS NOT NULL ORDER BY INGREDIENT_ID ASC';

        foreach ($db -> query($query, PDO::FETCH_ASSOC) as $row) {
            $id = $row['INGREDIENT_ID'];
            $name = $row['INGREDIENT'];
            $url = $row['URL'];
            $city = $row['CITY'];
            $class = $row['CLASS'];
            $ingredients[] = new $class($db, $id, $name, $url, $city);
        }

        return $ingredients;
    }

    public function resetPricesForIngredientForDate($ingredientID, $date)
    {
        $ingredient = self::getIngredientDetails($ingredientID);
        $ingredient->refetchPriceForDate($date);
    }

    /**
     * @param $ingredientID
     * @return FeedValIngredient
     */
    private static function getIngredientDetails($ingredientID)
    {
        $db = FeedValDatabaseConnectionFactory::getConnection();
        $query = 'SELECT INGREDIENT, URL, CITY, CLASS FROM ' . self::TBL_INGREDIENTS . ' WHERE INGREDIENT_ID = ' . $ingredientID;
        $row = $db->query($query)->fetch(PDO::FETCH_ASSOC);
        $name = $row['INGREDIENT'];
        $url = $row['URL'];
        $city = $row['CITY'];
        $class = $row['CLASS'];

        return new $class($db, $ingredientID, $name, $url, $city);
    }

    public function resetPricesForIngredient($ingredientID)
    {
        $ingredient = self::getIngredientDetails($ingredientID);
        $ingredient->refetchPrices();
    }

    public function resetPricesForDate($date)
    {
        $db = FeedValDatabaseConnectionFactory::getConnection();

        $ingredients = self::getUpdatableIngredients($db);
        foreach ($ingredients as $ingredient) {
            $db->beginTransaction();
            try {
                $ingredient->refetchPriceForDate($date);
            } catch (Exception $ex) {
                echo $ex->getMessage();
            }
            $db->commit();
        }
    }

}
