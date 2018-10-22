<?php

class FeedValUpdateAutoload {

    public static function autoload()
    {
        require_once '../vendor/autoload.php';
        require_once 'Console/GetoptPlus.php';
        require_once '../update/CornSilage.php';
        require_once '../update/FeedValDatabase.php';
        require_once '../update/FeedValIngredient.php';
        require_once '../update/FeedValIngredientType1.php';
        //require_once '../update/FeedValIngredientType2.php';
        //require_once '../update/GoodQualityHay.php';
	//require_once '../update/PoorQualityHay.php';
        require_once '../update/RawSoybean.php';
        require_once '../update/DatePriceUnit.php';
        require_once '../aspect/FeedValAspect.php';
        require_once '../aspect/DatabaseConnectionFactoryAspect.php';
        require_once '../aspect/FeedValIngredientAspect.php';
        require_once '../aspect/FeedValIngredientType1Aspect.php';
        require_once '../aspect/RawSoybeanAspect.php';
        require_once '../factory/DatabaseConnectionFactory.php';
        require_once '../factory/LoggerFactory.php';
        require_once '../utils/UnitConverter.php';
        require_once '../pdfparser/vendor/autoload.php'; //Added for retrieving Data from PDF
   	require_once '../update/FeedValIngredientType3.php';
	require_once '../update/GoodQualityHayNew.php';
        require_once '../update/FeedValIngredientType4.php';
        require_once '../update/PoorQualityHayNew.php';
	require_once '../update/FixedPriceType.php';
	#require_once '../aspect/FixedPriceAspect.php';
     }
}

spl_autoload_register('FeedValUpdateAutoload::autoload');
