<?php
/**
 * turns a field into a geo-coding field.
 *
 * @authors: Nicolaas [at] Sunny Side Up .co.nz
 * @package: forms
 * @sub-package: geocoding
 * @inspiration: http://gmaps-samples-v3.googlecode.com/svn/trunk/places/autocomplete-addressform.html
 **/
class GoogleAddressField extends TextField
{

    /**
     * @var string
     */
    private static $api_key = "";
    /**
     * @var string
     */
    private static $api_version = "3.24";

    /**
     * Do you want this annoying ...
     * this website wants to know exactly where you are
     * and what you are wearing thing ...
     * then this is your VAR.
     *
     * @param bool
     */
    public function setUseSensor($b)
    {
        $this->useSensor = $b;
    }

    protected $alwaysShowFields = false;

    /**
     * @param bool
     */
    public function setAlwaysShowFields($b)
    {
        $this->alwaysShowFields = $b;
    }

    /**
     * Link to the static map.  Set to an empty string to have no static image appear.
     * Use the [ADDRESS] tag to insert the address...
     * user the [MAXWIDTH] tag to set it automatically to the width of the container.
     *
     * @var string
     */
    protected $googleStaticMapLink = '//maps.googleapis.com/maps/api/staticmap?center=[ADDRESS]&zoom=17&scale=false&size=[MAXWIDTH]x[MAXHEIGHT]&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:red%7Clabel:%7C[ADDRESS]';

    /**
     * set to empty string to NOT show a static map.
     *
     * @param string
     */
    public function setGoogleStaticMapLink($s)
    {
        $this->googleStaticMapLink = $s;
    }

    /**
     * JS file used to run this field.
     *
     * @var string
     */
    protected $jsLocation = 'google_address_field/javascript/GoogleAddressField.js';

    /**
     * @param string
     */
    public function setJsLocation($s)
    {
        $this->jsLocation = $s;
    }

    /**
     * CSS file used in this field (can be themed!).
     *
     * @var string
     */
    protected $cssLocation = 'GoogleAddressField';

    /**
     * @param string
     */
    public function setCssLocation($s)
    {
        $this->cssLocation = $s;
    }

    /**
     * list of links between
     * form fields in the current field (e.g. TextField with name City)
     * and the result XML.
     * When the results are returned this field will fill the form
     * fields with XML data from the results using this array
     * Format is:
     * [formFieldName] => array(
     *   resultType1 => 'long_name',
     *   resultType2 => 'long_name',
     *   resultType2 => 'short_name',
     *   etc...
     * )
     * e.g.
     * <code php>
     *     "BillingRegion" => array("administrative_area_level_1" => "long_name", "country" => "short_name")
     * </code>.
     *
     * @var array
     */
    protected $fieldMap = array();

    /**
     * @param array
     */
    public function setFieldMap($a)
    {
        $this->fieldMap = $a;
    }

    /**
     * @param string $formField
     * @param array  $arrayOfGeoData
     */
    public function addFieldMapEntry($formField, $arrayOfGeoData)
    {
        $this->fieldMap[$formField] = $arrayOfGeoData;
    }

    /**
     * @param string $formField
     */
    public function removeFieldMapEntry($formField)
    {
        unset($this->fieldMap[$formField]);
    }

    /**
     * @return array
     */
    public function getFieldMap()
    {
        return $this->fieldMap;
    }

    /**
     * @return bool
     */
    public function hasData()
    {
        return false;
    }

    /**
     * @return string
     */
    public function Field($properties = array())
    {
        $this->addExtraClass('text');
        $googleJS =
        "//maps.googleapis.com/maps/api/js"
        ."?v=".$this->config()->get("api_version")
        ."&libraries=places"
        ."&key=".$this->config()->get("api_key");
        Requirements::javascript($googleJS);
        Requirements::javascript($this->jsLocation);
        Requirements::customScript(
            $this->getJavascript(),
            'GoogleAddressField'.$this->id()
        );
        if ($this->cssLocation) {
            Requirements::themedCSS($this->cssLocation, 'google_address_field');
        }
        $this->setAttribute('autocomplete', 'off');
        $this->setAttribute('autofill', 'off');
        //right title
        $this->RightTitle();

        return parent::Field($properties);
    }

    /**
     * retuns the customised Javascript for the form field.
     *
     * @return string
     */
    protected function getJavascript()
    {
        return '
        if(typeof GoogleAddressFieldOptions === "undefined") {
            GoogleAddressFieldOptions = [];
        }

        GoogleAddressFieldOptions.push(
            {
                id: \''.$this->id().'\',
                name: \''.$this->getName().'\',
                errorMessageMoreSpecific: \''.Convert::raw2js(_t('GoogleAddressField.ERROR_MESSAGE_MORE_SPECIFIC', 'Error: please enter a more specific location.')).'\',
                errorMessageAddressNotFound: \''.Convert::raw2js(_t('GoogleAddressField.ERROR_MESSAGE_ADDRESS_NOT_FOUND', 'Error: sorry, address could not be found.')).'\',
                findNewAddressText: \''.Convert::raw2js(_t('GoogleAddressField.FIND_NEW_ADDRESS', 'Find Different Address')).'\',
                relatedFields: '.Convert::raw2json($this->getFieldMap()).',
                alwaysShowFields: '.($this->alwaysShowFields ? 'true' : 'false').',
                googleStaticMapLink: \''.Convert::raw2js($this->googleStaticMapLink).'\',
                linkLabelToViewMap: \''.Convert::raw2js(_t('GoogleAddressField.LINK_LABEL_TO_VIEW_MAP', 'view map')).'\',
                defaultAddress: \''.Convert::raw2js(str_replace("'", '', $this->Value())).'\'
            }
        );';
    }
    /**
     * @return string
     */
    public function RightTitle()
    {
        $rightTitle = $this->renderWith('GoogleAddressFieldRightTitle');
        if (strlen(trim($rightTitle))) {
            return $rightTitle;
        }
    }
}
