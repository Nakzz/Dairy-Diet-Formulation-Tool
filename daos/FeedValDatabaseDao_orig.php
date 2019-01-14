<?php

class FeedValDatabaseDao extends FeedValDao {

    /**
     * @var PDO the database connection.
     */
    private $db;

    const NUMBER_OF_NUTRIENTS = 10;

    private $nutrients = array(
        'Nel3x Mcal/kg',
        'NDF %',
        'RUP %',
        'RDP %',
        'Lipid %',
        'peNDF %',
        'Ca %',
        'Phos %',
        'Starch',
    );


    private $ingredientsTableTags = array(
        'INGREDIENT_ID' => 'ID',
        'SELECTED'      => 'Selected',
        'INGREDIENT'    => 'Ingredient',
        'RUP_PCT'       => 'RUP',
        'RDP_PCT'       => 'RDP',
        'NEL3X_MCAL_KG' => 'NEl3x_Mcalkg',
        'LIPID_PCT'     => 'Lipid',
        'PENDF_PCT'     => 'peNDF',
        'CA_PCT'        => 'Ca',
        'PHOS_PCT'      => 'Phos',
        'NDF_PCT'       => 'NDF',
        'STARCH'        => 'Starch',
        'DM_PCT'        => 'DM',
        'MIN_KGCOWD'   => 'Min_kgcowd',
	'MAX_KGCOWD'    => 'Max_kgcowd',
    );

    public function __construct()
    {
        $this->db = FeedValDatabaseConnectionFactory::getConnection();
    }

    public function getNutrientCompositions()
    {
        $query = $this->getNutrientCompositionsQuery();
        return $this->db->query($query, PDO::FETCH_ASSOC);
    }

    private function getNutrientCompositionsQuery()
    {
        $i = 0;
        $query = 'SELECT ';
        foreach ($this->ingredientsTableTags as $column => $tag) {
            $query .= "$column as $tag";
            if (++$i != count($this->ingredientsTableTags)) {
                $query .= ',';
            }
            $query .= ' ';
        }
        $query .= "FROM ingredients ORDER BY INGREDIENT_ID ASC";

        return $query;
    }

    public function getNumberOfNutrients()
    {
        return self::NUMBER_OF_NUTRIENTS + 1; // plus 1 for CP.
    }

    public function getNumberOfIngredients()
    {
        $countColumn = 'COUNT';
        $query = "SELECT COUNT(INGREDIENT_ID) as $countColumn FROM ingredients";
        $rows = $this->db->query($query);
        $row = $rows->fetch(PDO::FETCH_ASSOC);

        return $row[$countColumn];
    }

    public function getPricesForDate($date)
    {
        $prices = array();
        $requiredUnits = $this->getRequiredUnits();
        $query = "SELECT INGREDIENT_ID, PRICE, UNIT FROM prices WHERE DATE = '" . $date . "'";
        foreach ($this->db->query($query, PDO::FETCH_ASSOC) as $row) {
            $id = $row['INGREDIENT_ID'];
            $sourcePrice = $row['PRICE'];
            $sourceUnit = $row['UNIT'];
            $ingredient = $requiredUnits[$id]['ingredient'];
            $requiredUnit = $requiredUnits[$id]['unit'];
            $priceInRequiredUnit = UnitConverter::getPriceInUnit($ingredient, $sourcePrice, $sourceUnit, $requiredUnit);

            $prices[$id] = array('price' => round($priceInRequiredUnit, 2), 'unit' => $requiredUnit);
        }

        return $prices;
    }

    public function getRequiredUnits()
    {
        $requiredUnits = array();
        $query = 'SELECT INGREDIENT_ID, INGREDIENT, UNIT FROM ingredients ORDER BY INGREDIENT_ID ASC';
        $rows = $this->db->query($query, PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            $id = $row['INGREDIENT_ID'];
            $ingredient = $row['INGREDIENT'];
            $unit = $row['UNIT'];
            $requiredUnits[$id] = array('ingredient' => $ingredient, 'unit' => $unit);
        }

        return $requiredUnits;
    }

    public function getMinDate()
    {
        $query = 'SELECT MIN(DATE) AS MIN_DATE FROM prices';
        $rows = $this->db->query($query);
        $row = $rows->fetch(PDO::FETCH_ASSOC);

        return $row['MIN_DATE'];
    }

    public function getMaxDate()
    {
        $query = 'SELECT MAX(DATE) AS MAX_DATE FROM prices';
        $rows = $this->db->query($query);
        $row = $rows->fetch(PDO::FETCH_ASSOC);

        return $row['MAX_DATE'];
    }

    public function getLatestPrices()
    {
        $todaysDate = new DateTime('now');
        $maxDate = new DateTime($this->getMaxDate());
        $dateObect = $maxDate > $todaysDate? $todaysDate : $maxDate;
        $date = $dateObect->format('Y-m-d');
        $latestPrices = array();
        $query = 'SELECT INGREDIENT_ID, PRICE, UNIT ' .
            'FROM prices ' .
            "WHERE DATE = '$date'";
        $rows = $this->db->query($query, PDO::FETCH_ASSOC);

        foreach ($rows as $row) {
            $id = $row['INGREDIENT_ID'];
            $price = $row['PRICE'];
            $unit = $row['UNIT'];
            $latestPrices[$id] = array('price' => $price, 'unit' => $unit);
        }

        return $latestPrices;
    }

    public function getNutrients()
    {
        return $this->nutrients;
    }
}
