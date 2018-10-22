<?php

class FeedValMinimizationFactory {

    public static function getCoefficients($columnsToAppear, $data)
    {
        return new FeedValMinimization($columnsToAppear, $data);
    }
}
