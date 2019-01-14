<?php

abstract class UnitConverter {
    const NUM_POUNDS_IN_ONE_CORN_BUSHEL = 56;
    const NUM_POUNDS_IN_ONE_WHEAT_BUSHEL = 60;
    const NUM_POUNDS_IN_ONE_SOYBEAN_BUSHEL = 60;
    const NUM_POUNDS_IN_ONE_OAT_BUSHEL = 32;
    const NUM_POUNDS_IN_ONE_WHOLE_COTTONSEED_BUSHEL = 32;
    const NUM_POUNDS_IN_ONE_BARLEY_BUSHEL = 48;
    const NUM_POUNDS_IN_ONE_CWT = 100;
    const NUM_POUNDS_IN_ONE_TON = 2000;
    const NUM_POUNDS_IN_ONE_KG = 2.20462262185;

    public abstract function toBu($ingredient, $price);
    public abstract function toCwt($ingredient, $price);
    public abstract function toTon($ingredient, $price);
    public abstract function toKg($ingredient, $price);
    public abstract function toLb($ingredient, $price);

    public static function getToUnitFunction($toUnit)
    {
        return 'to' . ucfirst(strtolower($toUnit));
    }

    public static function getFromUnitObject($fromUnit)
    {
        $fromUnitClass = ucfirst(strtolower($fromUnit));
        return new $fromUnitClass;
    }

    public static function getPriceInUnit($ingredient, $price, $fromUnit, $toUnit)
    {
        $fromUnitObject = UnitConverter::getFromUnitObject($fromUnit);
        $toUnitFunction = UnitConverter::getToUnitFunction($toUnit);
        $value = $fromUnitObject->$toUnitFunction($ingredient, $price);

        return $value;
    }

    protected static function getNumPoundsInOneBushel($ingredient)
    {
        if (strcasecmp($ingredient, 'Shelled Corn') == 0) {
            $numPoundsInOneBushel = self::NUM_POUNDS_IN_ONE_CORN_BUSHEL;
        } else if (strcasecmp($ingredient, 'Soybeans, raw') == 0) {
            $numPoundsInOneBushel = self::NUM_POUNDS_IN_ONE_SOYBEAN_BUSHEL;
        } else if (strcasecmp($ingredient, 'Oats') == 0) {
            $numPoundsInOneBushel = self::NUM_POUNDS_IN_ONE_OAT_BUSHEL;
        } else if (strcasecmp($ingredient, 'Whole Cottonseed') == 0) {
            $numPoundsInOneBushel = self::NUM_POUNDS_IN_ONE_WHOLE_COTTONSEED_BUSHEL;
        } else if (strcasecmp($ingredient, 'Barley') == 0) {
            $numPoundsInOneBushel = self::NUM_POUNDS_IN_ONE_BARLEY_BUSHEL;
        } else if (strcasecmp($ingredient, 'Wheat') == 0){
            $numPoundsInOneBushel = self::NUM_POUNDS_IN_ONE_WHEAT_BUSHEL;
        } else {
            throw new RuntimeException("Unit Bushels not supported for ingredient $ingredient.");
        }

        return $numPoundsInOneBushel;
    }

    protected static function getNumBushelsInOnePound($ingredient)
    {
        return 1 / self::getNumPoundsInOneBushel($ingredient);
    }

    protected static function getNumTonsInOneCwt()
    {
        return self::NUM_POUNDS_IN_ONE_CWT / self::NUM_POUNDS_IN_ONE_TON;
    }

    protected static function getNumCwtsInOneTon()
    {
        return 1 / self::getNumTonsInOneCwt();
    }

    protected static function getNumTonsInOnePound()
    {
        return 1 / self::NUM_POUNDS_IN_ONE_TON;
    }

    protected static function getNumCwtsInOnePound()
    {
        return 1 / self::NUM_POUNDS_IN_ONE_CWT;
    }

    protected static function getNumKgsInOneCwt()
    {
        return self::NUM_POUNDS_IN_ONE_CWT / self::NUM_POUNDS_IN_ONE_KG;
    }

    protected static function getNumCwtsInOneKg()
    {
        return 1/ self::getNumKgsInOneCwt();
    }

    protected static function getNumTonsInOneKg()
    {
        return self::NUM_POUNDS_IN_ONE_KG / self::NUM_POUNDS_IN_ONE_TON;
    }

    protected static function getNumKgsInOneTon()
    {
        return 1 / self::getNumTonsInOneKg();
    }

    protected static function getNumKgsInOnePound()
    {
        return 1 / self::NUM_POUNDS_IN_ONE_KG;
    }

}

class Cwt extends UnitConverter {

    public function toCwt($ingredient, $price)
    {
        return $price;
    }

    public function toBu($ingredient, $price)
    {
        $numPoundsInOneBushel = self::getNumPoundsInOneBushel($ingredient);
        $numBushelsInOneCwt = self::NUM_POUNDS_IN_ONE_CWT / $numPoundsInOneBushel;
        return $price / $numBushelsInOneCwt;
    }

    public function toTon($ingredient, $price)
    {
        $numTonsInOneCwt = self::getNumTonsInOneCwt();
        return $price / $numTonsInOneCwt;
    }

    public function toKg($ingredient, $price)
    {
        $numKgsInOneCwt = self::getNumKgsInOneCwt();
        return $price / $numKgsInOneCwt;
    }

    public function toLb($ingredient, $price)
    {
        return $price / self::NUM_POUNDS_IN_ONE_CWT;
    }
}

class Bu extends UnitConverter {

    public function toBu($ingredient, $price)
    {
        return $price;
    }

    public function toCwt($ingredient, $price)
    {
        $numPoundsInOneBushel = self::getNumPoundsInOneBushel($ingredient);
        $numCwtsInOneBushel = $numPoundsInOneBushel / self::NUM_POUNDS_IN_ONE_CWT;
        return $price / $numCwtsInOneBushel;
    }

    public function toTon($ingredient, $price)
    {
        $numPoundsInOneBushel = self::getNumPoundsInOneBushel($ingredient);
        $numTonsInOneBushel = $numPoundsInOneBushel / self::NUM_POUNDS_IN_ONE_TON;
        return $price / $numTonsInOneBushel;
    }

    public function toKg($ingredient, $price)
    {
        $numPoundsInOneBushel = self::getNumPoundsInOneBushel($ingredient);
        $numKgsInOneBushel = $numPoundsInOneBushel / self::NUM_POUNDS_IN_ONE_KG;
        return $price / $numKgsInOneBushel;
    }

    public function toLb($ingredient, $price)
    {
        return $price / self::getNumPoundsInOneBushel($ingredient);
    }
}

class Ton extends UnitConverter {

    public function toTon($ingredient, $price)
    {
        return $price;
    }

    public function toBu($ingredient, $price)
    {
        $numPoundsInOneBushel = self::getNumPoundsInOneBushel($ingredient);
        $numBushelsInOneTon = self::NUM_POUNDS_IN_ONE_TON / $numPoundsInOneBushel;
        return $price / $numBushelsInOneTon;
    }

    public function toCwt($ingredient, $price)
    {
        $numCwtsInOneTon = self::getNumCwtsInOneTon();
        return $price / $numCwtsInOneTon;
    }

    public function toKg($ingredient, $price)
    {
        $numKgsInOneTon = self::getNumKgsInOneTon();
        return $price / $numKgsInOneTon;
    }

    public function toLb($ingredient, $price)
    {
        return $price / self::NUM_POUNDS_IN_ONE_TON;
    }
}

class Lb extends UnitConverter {

    public function toLb($ingredient, $price)
    {
        return $price;
    }

    public function toBu($ingredient, $price)
    {
        $numBushelsInOnePound = self::getNumBushelsInOnePound($ingredient);
        return $price / $numBushelsInOnePound;
    }

    public function toCwt($ingredient, $price)
    {
        return $price / self::getNumCwtsInOnePound();
    }

    public function toTon($ingredient, $price)
    {
        return $price / self::getNumTonsInOnePound();
    }

    public function toKg($ingredient, $price)
    {
        return $price / self::getNumKgsInOnePound();
    }
}

class Kg extends UnitConverter {

    public function toKg($ingredient, $price)
    {
        return $price;
    }

    public function toBu($ingredient, $price)
    {
        $numPoundsInOneBushel = self::getNumPoundsInOneBushel($ingredient);
        $numBushelsInOneKg = self::NUM_POUNDS_IN_ONE_KG / $numPoundsInOneBushel;
        return $price / $numBushelsInOneKg;
    }

    public function toCwt($ingredient, $price)
    {
        $numCwtsInOneKg = self::getNumCwtsInOneKg();
        return $price / $numCwtsInOneKg;
    }

    public function toTon($ingredient, $price)
    {
        $numTonsInOneKg = self::getNumTonsInOneKg();
        return $price / $numTonsInOneKg;
    }

    public function toLb($ingredient, $price)
    {
        return $price / self::NUM_POUNDS_IN_ONE_KG;
    }
}
