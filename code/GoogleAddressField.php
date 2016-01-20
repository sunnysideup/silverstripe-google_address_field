<?php
/**
 * turns a field into a geo-coding field.
 * @authors: Nicolaas [at] Sunny Side Up .co.nz
 * @package: forms
 * @sub-package: geocoding
 * @inspiration: http://gmaps-samples-v3.googlecode.com/svn/trunk/places/autocomplete-addressform.html
 **/

class GoogleAddressField extends TextField {

	/**
	 * Do you want this annoying ... this website wants to know exactly where you are
	 * and what you are wearing thing ... this is your VAR.
	 * @param Boolean
	 */
	public function setUseSensor($b) {$this->useSensor = $b;}

	/**
	 *
	 * @var Boolean
	 */
	protected $allowByPass = true;

	/**
	 * Do you like to allow the user to by-pass the Google Coding
	 * @param Boolean
	 */
	public function setAllowByPass($b) {$this->allowByPass = $b;}

	/**
	 * JS file used to run this field
	 * @var String
	 */
	protected $googleSourceJS = "//maps.google.com/maps/api/js?libraries=places";

	/**
	 *
	 * @param String
	 */
	public function setGoogleSourceJS($s) {$this->googleSourceJS = $s;}

	/**
	 * Link to the static map.  Set to an empty string to have no static image appear.
	 * Use the [ADDRESS] tag to insert the address...
	 * user the [MAXWIDTH] tag to set it automatically to the width of the container.
	 * @var String
	 */
	protected $googleStaticMapLink = "//maps.googleapis.com/maps/api/staticmap?center=[ADDRESS]&zoom=17&scale=false&size=[MAXWIDTH]x300&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:red%7Clabel:%7C[ADDRESS]";

	/**
	 * set to empty string to NOT show a static map
	 *
	 * @param String
	 */
	public function setGoogleStaticMapLink($s) {$this->googleStaticMapLink = $s;}

	/**
	 * JS file used to run this field
	 * @var String
	 */
	protected $jsLocation = "google_address_field/javascript/GoogleAddressField.js";

	/**
	 *
	 * @param String
	 */
	public function setJsLocation($s) {$this->jsLocation = $s;}

	/**
	 * CSS file used in this field (can be themed!)
	 * @var String
	 */
	protected $cssLocation = "GoogleAddressField";

	/**
	 *
	 * @param String
	 */
	public function setCssLocation($s) {$this->cssLocation = $s;}

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
	 * </code>
	 * @var Array
	 */
	protected $fieldMap = array();

	/**
	 *
	 * @param Array
	 */
	public function setFieldMap($a) {$this->fieldMap = $a;}

	/**
	 *
	 * @param String $formField
	 * @param Array $arrayOfGeoData
	 */
	public function addFieldMapEntry($formField, $arrayOfGeoData) {$this->fieldMap[$formField] = $arrayOfGeoData;}

	/**
	 *
	 * @param String $formField
	 */
	public function removeFieldMapEntry($formField) {unset($this->fieldMap[$formField]);}

	/**
	 *
	 * @return Array
	 */
	public function getFieldMap() {return $this->fieldMap;}

	/**
	 * @return Boolean
	 */
	function hasData() { return false; }

	/**
	 * @return string
	 */
	function Field($properties = array()) {
		$this->addExtraClass("text");
		Requirements::javascript($this->googleSourceJS);
		Requirements::javascript($this->jsLocation);
		Requirements::customScript($this->getJavascript(), "GoogleAddressField".$this->id());
		if($this->cssLocation) {
			Requirements::themedCSS($this->cssLocation, "google_address_field");
		}
		$this->setAttribute("autocomplete", "off");
		$this->setAttribute("autofill", "off");
		//right title
		$byPassLink = "";
		$viewGoogleMapLink = "";
		if($this->allowByPass) {
			$byPassLink = "<a href=\"https://developers.google.com/maps/documentation/geocoding/\" class=\"bypassGoogleGeocoding\">"._t("GoogleAddressField.BYPASS_GOOGLE_GEOCODING", "by-pass Google Address Finder")."</a>";

		}
		$viewGoogleMapLink = "<a href=\"#\" class=\"viewGoogleMapLink\">"._t("GoogleAddressField.VIEW_GOOGLE_MAP", "View Map")."</a>";
		$this->setRightTitle($byPassLink.$viewGoogleMapLink);
		return parent::Field($properties);
	}

	/**
	 * retuns the customised Javascript for the form field.
	 * @return String
	 */
	protected function getJavascript(){
		return "
			var GoogleAddressField".$this->id()." = new GoogleAddressField( '".Convert::raw2js($this->getName())."')
				.setVar('errorMessageMoreSpecific', '".Convert::raw2js(_t("GoogleAddressField.ERROR_MESSAGE_MORE_SPECIFIC", "Error: please enter a more specific location."))."')
				.setVar('errorMessageAddressNotFound', '".Convert::raw2js(_t("GoogleAddressField.ERROR_MESSAGE_ADDRESS_NOT_FOUND", "Error: sorry, address could not be found."))."')
				.setVar('findNewAddressText', '".Convert::raw2js(_t("GoogleAddressField.FIND_NEW_ADDRESS", "Find Alternative Address"))."')
				.setVar('relatedFields', ".Convert::raw2json($this->getFieldMap()).")
				.setVar('googleStaticMapLink', '".Convert::raw2js($this->googleStaticMapLink)."')
				.setVar('linkLabelToViewMap', '".Convert::raw2js(_t("GoogleAddressField.LINK_LABEL_TO_VIEW_MAP", "view map"))."')
				.init();";
	}


}
