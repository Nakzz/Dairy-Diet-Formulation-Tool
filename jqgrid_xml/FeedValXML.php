<?php

abstract class FeedValXML {

    const XML_ROWS_ELEMENT = 'Rows';
    const XML_ROW_ELEMENT = 'Row';
    const XML_ROOT_ELEMENT = 'Root';

    const ID = 'ID';
    const SELECTED = 'Selected';
    const INGREDIENT = 'Ingredient';
    const RUP = 'RUP';
    const RDP = 'RDP';
    const CP = 'CP';
    const DM = 'DM';
    const MINOP = 'Min_kgcowd';
    const MAXOP = 'Max_kgcowd';
    const PRICE = 'Price_Unit';
    const UNIT = 'Unit';
    const PREDICTED_VALUE = 'Predicted_Value';
    const ACTUAL_PRICE = 'Actual_Price';
    const DEFAULT_UNIT = 'ton';

    const JQGRID_COLMODEL_FILE = 'conf/jqGridColModel.yaml';
    const JQGRID_SETTINGS_FILE = 'conf/jqGridSettings.yaml';

    protected $superColModel;

    /**
     * @var FeedValDao the data access object.
     */
    protected $feedValDao;

    /**
     * @var DOMDocument the DOM document.
     */
    protected $xmlDoc;

    public function __construct()
    {
        $this->xmlDoc = new DOMDocument('1.0', 'utf-8');
        $this->superColModel = $this->getSuperColModel();
    }

    protected final function getSuperColModel()
    {
        $yaml = yaml_parse_file(self::JQGRID_COLMODEL_FILE);
        return $yaml['colModel'];
    }

    protected final function getCPPCT($array)
    {
        $rup_pct = isset($array[self::RUP])? $array[self::RUP] : 0;
        $rdp_pct = isset($array[self::RDP])? $array[self::RDP] : 0;
        return $rup_pct + $rdp_pct;
    }

    protected final function newXMLElement($tag, $value)
    {
        return $this->xmlDoc->createElement($tag, $value);
    }

    protected function getXMLTags($labels)
    {
        $xmlTags = array();
        foreach ($labels as $label) {
            $xmlTags[$label] = NULL;
            foreach ($this->superColModel as $column) {
                if (strcasecmp($label, $column['label']) == 0) {
                    $xmlTags[$label] = $column['xmlmap'];
                    break;
                }
            }
        }

        return $xmlTags;
    }

    protected function getPermittedUnits()
    {
        return array('ton', 'cwt', 'kg', 'lb');
    }

    protected function getUnitsSelectElement($ingPermittedUnits, $ingRequiredUnit)
    {
        $select = '<select class="unit">';
        foreach ($ingPermittedUnits as $ingPermittedUnit) {
            $option = '<option value="' . $ingPermittedUnit . '"';
            if (strcasecmp($ingRequiredUnit, $ingPermittedUnit) == 0) {
                $option .= ' selected="selected"';
            }
            $option .= ">$ingPermittedUnit</option>";
            $select .= $option;
        }
        $select .= '</select>';

        return $select;
    }

    protected function needToAppendCP()
    {
        if (!$this->feedValDao->containsCP() &&
            ($this->feedValDao->containsRdp() || $this->feedValDao->containsRup())) {
            return true;
        }
        return false;
    }

    public function getNutrients()
    {
        $nutrients = $this->feedValDao->getNutrients();
        if ($this->needToAppendCP()) {
            $nutrients[] = $this->superColModel[self::CP]['label'];
        }
        $xmlTags = $this->getXMLTags($nutrients);

        return array_flip($xmlTags);
    }

    public abstract function getXML();

    public abstract function getJQGridSettings();

    public abstract function getNumberOfNutrients();

}
