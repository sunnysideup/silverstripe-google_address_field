<?php

namespace Sunnysideup\GoogleAddressField;

use SilverStripe\Core\Config\Config;
use SilverStripe\Core\Convert;
use SilverStripe\Core\Manifest\ModuleResourceLoader;
use SilverStripe\Forms\TextField;
use SilverStripe\View\Requirements;

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
     * @var bool
     */
    protected $useSensor = false;

    protected $alwaysShowFields = false;

    /**
     * Link to the static map.  Set to an empty string to have no static image appear.
     * Use the [ADDRESS] tag to insert the address...
     * user the [MAXWIDTH] tag to set it automatically to the width of the container.
     *
     * @var string
     */
    protected $googleStaticMapLink = '//maps.googleapis.com/maps/api/staticmap?center=[ADDRESS]&amp;zoom=17&amp;scale=false&amp;size=[MAXWIDTH]x[MAXHEIGHT]&amp;maptype=roadmap&amp;format=png&amp;visual_refresh=true&amp;markers=size:mid%7Ccolor:red%7Clabel:%7C[ADDRESS]';

    /**
     * CSS file used in this field (can be themed!).
     *
     * @var string
     */
    protected $themedCssLocation = 'client/css/GoogleAddressField';

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
    protected $fieldMap = [];

    protected $typeToBeReturned = 'address';

    protected $restrictToCountryCode = '';

    private static $google_map_api_location = '//maps.googleapis.com/maps/api/js';

    private static $field_js_location = 'sunnysideup/google_address_field: client/javascript/GoogleAddressField.js';

    //when autocomplete returns a place we check if the type is an allowed type and if not
    //provide the user an alert to let them know their address may not have been correctly autocompleted
    private static $allowed_types = ['street_address'];

    /**
     * @var string
     */
    private static $api_key = '';

    /**
     * return a list of requirements
     * @return
     */
    public static function js_requirements()
    {
        $array = [];
        $api = Config::inst()->get(GoogleAddressField::class, 'google_map_api_location');
        $js_location = Config::inst()->get(GoogleAddressField::class, 'field_js_location');
        $js = ModuleResourceLoader::singleton()->resolveURL($js_location);
        if ($api) {
            $array[] = $api
            . '?'
            . '&libraries=places'
            . '&key=' . Config::inst()->get(GoogleAddressField::class, 'api_key');
        }
        if ($js) {
            $array[] = $js;
        }

        return $array;
    }

    /**
     * Do you want this annoying ...
     * this website wants to know exactly where you are
     * and what you are wearing thing ...
     * then this is your VAR.
     *
     * @param $b
     */
    public function setUseSensor($b)
    {
        $this->useSensor = $b;
        return $this;
    }

    /**
     * @param $b
     */
    public function setAlwaysShowFields($b)
    {
        $this->alwaysShowFields = $b;
        return $this;
    }

    /**
     * set to empty string to NOT show a static map.
     *
     * @param $s
     */
    public function setGoogleStaticMapLink($s)
    {
        $this->googleStaticMapLink = $s;
        return $this;
    }

    /**
     * get to empty string to NOT show a static map.
     *
     * @return string
     */
    public function getGoogleStaticMapLink()
    {
        return $this->googleStaticMapLink . '&amp;key=' . Config::inst()->get(GoogleAddressField::class, 'api_key');
    }

    /**
     * @param $s
     */
    public function setCssLocation($s)
    {
        $this->themedCssLocation = $s;
        return $this;
    }

    /**
     * @param $a
     */
    public function setFieldMap($a)
    {
        $this->fieldMap = $a;
        return $this;
    }

    /**
     * @param string $formField
     * @param array  $arrayOfGeoData
     */
    public function addFieldMapEntry($formField, $arrayOfGeoData)
    {
        $this->fieldMap[$formField] = $arrayOfGeoData;
        return $this;
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
     * @param string $type - e.g. address
     */
    public function setTypeToBeReturned($type)
    {
        $this->typeToBeReturned = $type;

        return $this;
    }

    /**
     * @param string $code - e.g. NZ
     */
    public function setRestrictToCountryCode($code)
    {
        $this->restrictToCountryCode = $code;

        return $this;
    }

    /**
     * @return string
     */
    public function getRestrictToCountryCode()
    {
        return $this->restrictToCountryCode;
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
    public function Field($properties = [])
    {
        $this->addExtraClass('text');
        foreach (self::js_requirements() as $jsFile) {
            Requirements::javascript($jsFile);
        }
        Requirements::customScript(
            $this->getJavascript(),
            GoogleAddressField::class . $this->id()
        );

        if ($this->themedCssLocation) {
            Requirements::themedCSS($this->themedCssLocation);
        }
        $this->setAttribute('autocomplete', 'false');
        $this->setAttribute('autofill', 'false');
        $this->setAttribute('data-selectedOptionNotAllowed', Convert::raw2att(_t('GoogleAddressField.SELECTED_OPTION_NOT_ALLOWED', 'ERROR: You have selected an invalid')));
        $this->setAttribute('data-errorMessageMoreSpecific', Convert::raw2att(_t('GoogleAddressField.ERROR_MESSAGE_MORE_SPECIFIC', 'Error: please enter a more specific location.')));
        $this->setAttribute('data-errorMessageAddressNotFound', Convert::raw2att(_t('GoogleAddressField.ERROR_MESSAGE_ADDRESS_NOT_FOUND', 'Error: sorry, address could not be found.')));
        $this->setAttribute('data-findNewAddressText', Convert::raw2att(_t('GoogleAddressField.FIND_NEW_ADDRESS', 'Find Different Address')));
        $this->setAttribute('data-relatedFields', Convert::raw2att(Convert::raw2json($this->getFieldMap())));
        $this->setAttribute('data-alwaysShowFields', ($this->alwaysShowFields ? 'true' : 'false'));
        $this->setAttribute('data-useSensor', ($this->useSensor ? 'true' : 'false'));
        $this->setAttribute('data-googleStaticMapLink', $this->getGoogleStaticMapLink());
        $this->setAttribute('data-typeToBeReturned', $this->typeToBeReturned);
        if ($code = $this->getRestrictToCountryCode()) {
            $this->setAttribute('data-restrictToCountryCode', $code);
        }
        $this->setAttribute('data-linkLabelToViewMap', Convert::raw2att(_t('GoogleAddressField.LINK_LABEL_TO_VIEW_MAP', 'view map')));
        $this->setAttribute('data-defaultAddress', Convert::raw2att(str_replace("'", '', $this->Value())));
        //right title
        $this->RightTitle();

        return parent::Field($properties);
    }

    /**
     * @return string
     */
    public function RightTitle()
    {
        $rightTitle = $this->renderWith('Sunnysideup/GoogleAddressField/GoogleAddressFieldRightTitle');
        if (strlen(trim($rightTitle))) {
            return $rightTitle;
        }
    }

    /**
     * retuns the customised Javascript for the form field.
     *
     * @return string
     */
    protected function getJavascript()
    {
        $allowed_types = Config::inst()->get(GoogleAddressField::class, 'allowed_types');

        if ($allowed_types) {
            return '
                if(typeof GoogleAddressFieldStatics === "undefined") {
                    var GoogleAddressFieldStatics = {};
                }
                GoogleAddressFieldStatics.allowedTypes = ' . json_encode($allowed_types) . ';
            ';
        }

        return '';
    }
}
