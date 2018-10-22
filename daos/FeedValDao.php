<?php

abstract class FeedValDao {
    abstract function getNutrients();

    private function spreadsheetContainsNutrient($nutrientRegex)
    {
        $nutrients = $this->getNutrients();
        $matchingNutrients = preg_grep($nutrientRegex, $nutrients);
        return count($matchingNutrients) != 0;
    }

    public function containsCP()
    {
        $cpRegex = '/^\s*CP\s*%/i';
        return $this->spreadsheetContainsNutrient($cpRegex);
    }

    public function containsRup()
    {
        $rupRegex = '/^\s*RUP\s*%/i';
        return $this->spreadsheetContainsNutrient($rupRegex);
    }

    public function containsRdp()
    {
        $rdpRegex = '/^\s*RDP\s*%/i';
        return $this->spreadsheetContainsNutrient($rdpRegex);
    }
} 