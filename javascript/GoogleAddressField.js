/**
 * This JS comes with the GoogleAddressField Field.
 *
 * It allows the user to find their address using the Google
 * GeoCoding API.
 *
 * @todo: integrate with GeoCoder for lookups of previous addresses... see http://jsfiddle.net/YphZw/
 *
 * @see: https://developers.google.com/maps/documentation/javascript/places-autocomplete
 *
 */



jQuery(document).ready(
    function(){
        jQuery('input.text.googleaddress').each(
            function(i, el) {
                GoogleAddressFieldInstatiator.init(jQuery(el));
            }
        );
        GoogleAddressFieldInstatiator.attachInCMS()
    }
);

var GoogleAddressFieldInstatiator = {
    init: function(elements) {
        elements.each(
            function() {
                if(jQuery(this).attr('data-instantiated') === 'done') {
                } else {
                    var options = jQuery(this).data();
                    options['name'] = jQuery(this).attr('name');
                    jQuery(this).attr('data-instantiated', 'done');
                    var field = new GoogleAddressField(options['name']);
                    for (var key in options) {
                        if(key === 'relatedfields') {
                            var value = options[key].replace(/&quot;/g, '\"');
                            value = JSON.parse(value); // this is how you parse a string into JSON
                        } else {
                            var value  = options[key];
                        }
                        if(value === 'false') {
                            value = false;
                        }
                        if(value === 'true') {
                            value = true;
                        }
                        if ( ! options.hasOwnProperty(key)) {
                            continue;
                        }
                        field.setVar(key, value);
                    }
                    field.init();
                }
            }
        );
    },
    attachInCMS: function() {
        if(typeof jQuery.entwine !=='undefined' ) {
            jQuery.entwine(
                function(jQuery) {
                    jQuery('input.text.googleaddress').entwine(
                        {
                            onmatch: function() {
                                jQuery('input.text.googleaddress').each(
                                    function(i, el) {
                                        GoogleAddressFieldInstatiator.init(jQuery(el));
                                    }
                                );
                            }
                        }
                    );
                }
            );
        }
    }
}


var GoogleAddressField = function(fieldName) {

    var geocodingFieldVars = {

        /**
         * @type Boolean
         */
        debug: false,

        /**
         * the default address for this form field (if any)...
         *
         * @type String
         */
        defaultAddress: "",

        /**
         * name of the html field (e.g. MyInputField)
         * this is provided by PHP using a small customScript
         *
         * @type String
         */
        fieldName: fieldName,

        /**
         * object that is being used to find the address.
         * basically the jquery object of the input field in html
         * This is set in the init method
         * @type jQueryObject
         */
        entryField: null,

        /**
         * div holding the input
         * basically the jquery object of the input field in html
         * This is set in the init method
         * @type jQueryObject
         */
        entryFieldHolder: null,

        /**
         * Right Label
         * This is set in the init method
         * @type jQueryObject
         */
        entryFieldRightLabel: null,

        /**
         * Left Label
         * This is set in the init method
         * @type jQueryObject
         */
        entryFieldLeftLabel: null,

        /**
         * should we use the sensor on mobile
         * phones to help?
         * @type Boolean
         */
        useSensor: false,

        /**
         *
         * @type autocomplete object provided by Google
         */
        autocomplete: null,

        /**
         *
         * @type autocompleteService object provided by Google
         */
        autocompleteService: null,

        /**
         *
         * @type autocompleteService object provided by Google
         */
        placesService: null,

        /**
         * based on format FormField: [GeocodingAddressType: format]
         *    Address1: {'subpremise': 'short_name', 'street_number': 'short_name', 'route': 'long_name'},
         *    Address2: {'locality': 'long_name'},
         *    City: {'administrative_area_level_1': 'short_name'},
         *    Country: {'country': 'long_name'},
         *    PostcalCode: {'postal_code': 'short_name'}
         *
         * @type JSON
         */
        relatedFields: {},

        /**
         * @type boolean
         */
        alwaysShowFields: true,

        /**
         *
         * @type String
         */
        findNewAddressText: "",

        /**
         *
         * @type String
         */
        errorMessageMoreSpecific: "",

        /**
         *
         * @type String
         */
        selectedOptionNotAllowed: "",

        /**
         *
         * @type String
         */
        errorMessageAddressNotFound: "",

        /**
         * when the Coding field has text...
         * @type string
         */
        hasTextClass: "hasText",

        /**
         * @type string
         */
        useMeClass: "useMe",

        /**
         * @type string
         */
        selectedClass: "selected",

        /**
         * @type string
         */
        bypassSelector: "a.bypassGoogleGeocoding",

        /**
         * @type string
         */
        returnSelector: "a.returnGoogleGeocoding",

        /**
         * @type string
         */
        viewGoogleMapLinkSelector: "a.viewGoogleMapLink",

        /**
         * @type string
         */
        classForUncompletedField: "holder-required",

        /**
         * @type string
         */
        byPassClass: "field-is-hidden",

        /**
         * @type string
         */
        googleStaticMapLink: "",


        /**
         * default witdth of static image
         * @type Int
         */
        defaultWidthOfStaticImage: 300,

        /**
         * default height of static image
         * you can override this by
         * @type Int
         */
        defaultHeightOfStaticImage: 300,

        /**
         * @type string
         */
        urlForViewGoogleMapLink: "http://maps.google.com/maps/search/",

        /**
         * @type string
         */
        linkLabelToViewMap: "View Map",

        /**
         * percentage of fields that need to be completed.
         * @float
         */
        percentageToBeCompleted: 0.25,

        /**
         * @see: https://developers.google.com/maps/documentation/javascript/places-autocomplete#add_autocomplete
         * @type {String}
         */
        typeToBeReturned: 'address',

        /**
         * Restrict search to country (currently only one country at the time is supported)
         * @type String
         */
        restrictToCountryCode: "",

        /**
         *
         * this method sets up all the listeners
         * and the basic state.
         */
        init: function () {
            //check if google exists...
            if(typeof google === "undefined") {
                console.debug('google map library is not loaded!');
                jQuery(".field.googleaddress").hide();
                this.alwaysShowFields = true;
                return ;
            }
            if(typeof GoogleAddressFieldStatics !== "undefined") {
                for (var key in GoogleAddressFieldStatics){
                    if (GoogleAddressFieldStatics.hasOwnProperty(key)) {
                        geocodingFieldVars[key] = GoogleAddressFieldStatics[key];
                    }
                }
            }
            geocodingFieldVars.entryField = jQuery('input[name="'+geocodingFieldVars.fieldName+'"]');
            geocodingFieldVars.entryFieldHolder = jQuery(geocodingFieldVars.entryField).closest("div.field");
            geocodingFieldVars.entryFieldRightLabel = geocodingFieldVars.entryFieldHolder.find('label.right');
            geocodingFieldVars.entryFieldLeftLabel = geocodingFieldVars.entryFieldHolder.find('label.left');

            //clean up affected fields
            //geocodingFieldVars.clearFields();
            geocodingFieldVars.hideFields();

            //set basic classes for input field

            geocodingFieldVars.setResults("no");
            geocodingFieldVars.updateEntryFieldStatus();

            //set up auto-complete stuff
            var fieldID = geocodingFieldVars.entryField.attr("id");
            var autocompleteConfig = { types: [geocodingFieldVars.typeToBeReturned] };
            if(geocodingFieldVars.restrictToCountryCode){
                autocompleteConfig.componentRestrictions = {country: geocodingFieldVars.restrictToCountryCode };
            }
            var fieldForAutocomplete = document.getElementById(fieldID);
            geocodingFieldVars.autocomplete = new google.maps.places.Autocomplete(
                fieldForAutocomplete,
                autocompleteConfig
            );

            geocodingFieldVars.autocompleteService = new google.maps.places.AutocompleteService();
            geocodingFieldVars.placesService = new google.maps.places.PlacesService(geocodingFieldVars.entryField.get(0));



            google.maps.event.addListener(
                geocodingFieldVars.autocomplete,
                'place_changed',
                function() {
                    geocodingFieldVars.fillInAddress();
                }
            );


            //add listeners
            geocodingFieldVars.entryField
                .focusin(
                    function(){
                        geocodingFieldVars.hideFields();
                        //use sensor ..
                        if(geocodingFieldVars.useSensor) {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    function(position) {
                                        var geolocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
                                        geocodingFieldVars.autocomplete.setBounds(new google.maps.LatLngBounds(geolocation, geolocation));
                                    }
                                );
                            }
                        }
                        geocodingFieldVars.updateEntryFieldStatus();
                    }
                )
                .focusout(
                    function(){
                        if(geocodingFieldVars.hasResults()) {
                            geocodingFieldVars.showFields();
                        }
                        geocodingFieldVars.updateEntryFieldStatus();
                    }
                )
                .keypress(
                    function(e){
                        var code = e.which;
                        if (code == 13 ) {
                            return false;
                        }
                    }
                )
                .on(
                    'input propertychange paste',
                    function(e){
                        //tab
                        if(geocodingFieldVars.hasResults()) {
                            geocodingFieldVars.clearFields();
                            geocodingFieldVars.setResults( "no");
                            geocodingFieldVars.updateEntryFieldStatus();

                        }
                        //or...if ( e.which == 13 ) e.preventDefault();
                    }
                );

            /**
             * to do ....
             * make the hack below work with rest of code!
             */
            (
                function pacSelectFirst(input) {
                    // store the original event binding function
                    var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;
                    function addEventListenerWrapper(type, listener) {
                        // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected,
                        // and then trigger the original listener.
                        if (type == "keydown") {
                            var orig_listener = listener;
                            listener = function(event) {
                                var suggestion_selected = jQuery(".pac-item-selected").length > 0;
                                if (event.which == 13 && !suggestion_selected) {
                                    var simulated_downarrow = jQuery.Event(
                                        "keydown",
                                        {
                                        keyCode: 40,
                                        which: 40
                                        }
                                    );
                                    orig_listener.apply(input, [simulated_downarrow]);
                                }

                                orig_listener.apply(input, [event]);
                            };
                        }

                        _addEventListener.apply(input, [type, listener]);
                    }

                    input.addEventListener = addEventListenerWrapper;
                    input.attachEvent = addEventListenerWrapper;
                    // geocodingFieldVars.autocomplete = new google.maps.places.Autocomplete(
                    //     input,
                    //     autocompleteConfig
                    // );
                }
            )(fieldForAutocomplete);

            //bypass
            geocodingFieldVars.entryFieldHolder.on(
                'click',
                geocodingFieldVars.bypassSelector,
                function(e){
                    e.preventDefault();
                    geocodingFieldVars.showFields();
                    geocodingFieldVars.entryFieldHolder.addClass(geocodingFieldVars.byPassClass);
                    return false;
                }
            );
            //return from bypass
            jQuery(geocodingFieldVars.returnSelector).on(
                'click',
                function(e){
                    e.preventDefault();
                    geocodingFieldVars.hideFields();
                    geocodingFieldVars.entryFieldHolder.removeClass(geocodingFieldVars.byPassClass);
                    return false;
                }
            );
            if(geocodingFieldVars.alreadyHasValues()) {
                if(geocodingFieldVars.entryFieldHolder.is(":hidden")) {

                }
                else {
                    geocodingFieldVars.showFields();
                    geocodingFieldVars.entryFieldLeftLabel.text(geocodingFieldVars.findNewAddressText);
                }
            }
            geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.viewGoogleMapLinkSelector).attr("target", "_googleMap");
            if(geocodingFieldVars.entryField.val().length > 0) {
                geocodingFieldVars.autocompleteService.getQueryPredictions(
                    {
                        input: geocodingFieldVars.entryField.val()
                    },
                    geocodingFieldVars.getfirstResult
                );
                //to do - to be completed!
                geocodingFieldVars.entryField.attr("placeholder", geocodingFieldVars.entryField.val());
                geocodingFieldVars.entryField.val("")
                //google.maps.event.trigger(geocodingFieldVars.autocomplete, 'place_changed');
                //console.debug(geocodingFieldVars.autocomplete);
            }
            if(typeof geocodingFieldVars.defaultAddress === "string" && geocodingFieldVars.defaultAddress.length > 0) {
                geocodingFieldVars.loadDefaultAddress();
                geocodingFieldVars.entryField.val(geocodingFieldVars.defaultAddress);
            }

            //validation
            jQuery(geocodingFieldVars.entryField)
                .closest("form")
                .on(
                    "click",
                    "input[type=submit]",
                    function(e){
                        geocodingFieldVars.showFields();
                    }
                );
        },

        fillInAddress: function(place) {
            var updated = false;
            if(typeof place === 'undefined') {
                var place = geocodingFieldVars.autocomplete.getPlace();
            }
            geocodingFieldVars.entryField.attr("data-has-result", "no");
            if(geocodingFieldVars.debug) {console.log(place); }
            //if(geocodingFieldVars.debug) {console.log(geocodingFieldVars.autocomplete);}
            var placeIsSpecificEnough = false;
            if(typeof place !== 'undefined') {
                var addressComponents = place.address_components;
                if(typeof addressComponents === 'undefined') {
                    addressComponents = place.types;
                }
                if(typeof addressComponents !== 'undefined') {
                    placeIsSpecificEnough = true;
                }
                var mapLink = geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.viewGoogleMapLinkSelector);
                if(placeIsSpecificEnough) {
                    var escapedAddress = encodeURIComponent(place.formatted_address);
                    mapLink.attr("href", geocodingFieldVars.urlForViewGoogleMapLink+escapedAddress);
                    var staticMapImageLink = geocodingFieldVars.getStaticMapImage(escapedAddress);
                    if(staticMapImageLink) {
                        mapLink.html("<img src=\""+staticMapImageLink+"\" alt=\"Google Map\" />");
                    }
                    else {
                        mapLink.html(geocodingFieldVars.linkLabelToViewMap);
                    }
                    if(place && place.address_components) {
                        place.address_components.push(
                            {
                                long_name: place.formatted_address,
                                short_name: place.formatted_address,
                                types: ["formatted_address"]
                            }
                        );
                        for (var formField in geocodingFieldVars.relatedFields) {
                            if (geocodingFieldVars.relatedFields.hasOwnProperty(formField)) {
                                var previousValues = [];
                                //reset field and show it...
                                var fieldToSet = jQuery("input[name='"+formField+"'],select[name='"+formField+"'],textarea[name='"+formField+"']");
                                var holderToSet = jQuery(fieldToSet).closest("div.field");
                                //holderToSet.removeClass("geoCodingSet");
                                if(fieldToSet.length > 0) {
                                    fieldToSet.show().val("");
                                    if(geocodingFieldVars.debug) {console.debug("- checking form field: "+formField+" now searching for data ...");}
                                    for (var j = 0; j < place.address_components.length; j++) {
                                        if(geocodingFieldVars.debug) {console.debug("- -----  ----- ----- provided information: "+place.address_components[j].long_name);}
                                        for (var k = 0; k < place.address_components[j].types.length; k++) {
                                            var googleType = place.address_components[j].types[k];
                                            //make sure the street number in the address components is the same as the number entered by in the autocomplete field
                                            if(googleType == 'street_number' && geocodingFieldVars.getStreetNumberFromInput()){
                                                var inputStreetNumber = geocodingFieldVars.getStreetNumberFromInput();
                                                if(inputStreetNumber != place.address_components[j].long_name){
                                                    place.address_components[j].long_name = inputStreetNumber;
                                                }
                                                if(inputStreetNumber != place.address_components[j].short_name){
                                                    place.address_components[j].short_name = inputStreetNumber;
                                                }
                                            }
                                            
                                            if(geocodingFieldVars.debug) {console.debug("- ----- ----- ----- ----- ----- ----- found Google Info for: "+googleType);}
                                            //if(geocodingFieldVars.debug) {console.log(geocodingFieldVars.relatedFields[formField]);}
                                            for (var fieldType in geocodingFieldVars.relatedFields[formField]) {
                                                if (geocodingFieldVars.relatedFields[formField].hasOwnProperty(fieldType)) {
                                                    if(geocodingFieldVars.debug) {console.debug("- ----- ----- ----- ----- ----- ----- ----- ----- ----- with form field checking: "+fieldType+" is the same as google type: "+googleType);}
                                                    if (fieldType == googleType) {
                                                        var googleVariable = geocodingFieldVars.relatedFields[formField][fieldType];
                                                        var value = place.address_components[j][googleVariable];
                                                        if(jQuery.inArray(value, previousValues) == -1) {
                                                            previousValues.push(value);
                                                            if(geocodingFieldVars.debug) {console.debug("- ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** ***** setting: "+formField+" to "+value+", using "+googleVariable+" in google address");}
                                                            previousValueForThisFormField = "";
                                                            value = value.trim()
                                                            if(googleType == "subpremise") {
                                                                value = value + "/";
                                                            }
                                                            //in input field
                                                            if(fieldToSet.is("input")) {
                                                                var previousValueForThisFormField = jQuery('input[name="'+formField+'"]').val();
                                                                value = previousValueForThisFormField + " " + value;
                                                            }
                                                            if(fieldToSet.is("textarea")) {
                                                                var previousValueForThisFormField = jQuery('textarea[name="'+formField+'"]').val();
                                                                value = previousValueForThisFormField + " " + value;
                                                            }
                                                            if(fieldToSet.is("select")) {
                                                                //check available options
                                                                //compare value to be set against available options
                                                                //if value to be set does not exist, show error message
                                                                //else do nothing
                                                                var match = false;
                                                                $(fieldToSet).find('option').each(
                                                                    function() {
                                                                        var option = jQuery(this).val();
                                                                        if(option == value){
                                                                            match = true;
                                                                        }
                                                                    }
                                                                );
                                                                if(! match) {
                                                                    var id = jQuery(fieldToSet).attr('id');
                                                                    var label = jQuery('label[for="'+id+'"');
                                                                    var labelString = jQuery(label).text();
                                                                    alert(geocodingFieldVars.selectedOptionNotAllowed + " " + labelString + ".");
                                                                    jQuery(fieldToSet).focus();
                                                                }
                                                            }
                                                            fieldToSet.val(value.trim());
                                                            geocodingFieldVars.setResults("yes");
                                                            //holderToSet.addClass("geoCodingSet");
                                                        }
                                                        else {
                                                            if(geocodingFieldVars.debug) {console.debug("- ----- ----- ----- ----- ----- ----- ----- ----- ----- data already used: "+value);}
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if(geocodingFieldVars.debug) {console.debug("E -----  ----- ----- could not find form field with ID: #"+formField+"");}
                                }
                            }
                            geocodingFieldVars.entryFieldLeftLabel.text(geocodingFieldVars.findNewAddressText);
                        }

                        geocodingFieldVars.entryField.val('');
                        geocodingFieldVars.entryField.attr('placeholder', '');

                    }
                    else {
                        geocodingFieldVars.entryField.val(geocodingFieldVars.errorMessageAddressNotFound);
                    }
                }
                else {
                    geocodingFieldVars.entryField.val(geocodingFieldVars.errorMessageMoreSpecific);
                    //reset links
                    mapLink
                        .attr("href", geocodingFieldVars.urlForViewGoogleMapLink)
                        .html("");
                }
                geocodingFieldVars.updateEntryFieldStatus();
                if(geocodingFieldVars.hasResults()) {
                    geocodingFieldVars.showFields();
                    //this is done last to make sure that if the alert is shown then the filled in fields filled won't be hidden
                    if(typeof place !== 'undefined') {
                        if(typeof place.types !== 'undefined') {
                            if(!geocodingFieldVars.allowedTypes.contains(place.types)){
                                alert('Please ensure your address details are correct as google could not find your exact location.');
                                setTimeout(
                                    function(){
                                        //make sure the fields are shown
                                        geocodingFieldVars.showFields();
                                    },
                                    0
                                );
                            }
                        }
                    }
                }
            }
        },

        getStreetNumberFromInput: function(){
            var streetNumber = '';
            var input = geocodingFieldVars.entryField.val();
            if(input.indexOf(' ')){
                streetNumber = input.substr(0, input.indexOf(' '));
            }
            return streetNumber;
        },

        /**
         * shows the address fields
         */
        showFields: function(){
            var firstField = '';
            var count = 0;
            for (var formField in geocodingFieldVars.relatedFields) {
                var fieldToSet = jQuery("input[name='"+formField+"'],select[name='"+formField+"'],textarea[name='"+formField+"']");
                var holderToSet = jQuery(fieldToSet).closest("div.field");
                if(fieldToSet.attr("type") !== "hidden") {
                    if(count < 1){
                        firstField = fieldToSet;
                        count++;
                    }
                    holderToSet.removeClass("hide").addClass("show");
                    var input = holderToSet.find("select[data-has-required='yes'], input[data-has-required='yes']").each(
                        function(i, el) {
                            jQuery(el).attr("required", "required").removeAttr("data-has-required");
                        }
                    );
                }
            }

            if(firstField.length){
                //make sure the autofilled fields are visible
                jQuery('html, body').animate(
                    {
                        scrollTop: geocodingFieldVars.entryField.offset().top
                    },
                    500
                );
                firstField.focus();
            }

            geocodingFieldVars.entryField.removeAttr("required");
            geocodingFieldVars.entryFieldHolder.removeAttr("required");
            jQuery(geocodingFieldVars.entryFieldHolder).prev().show();
        },

        /**
         * hides the address fields
         */
        hideFields: function(){
            if(this.alwaysShowFields === true) {
                return;
            }
            var makeItRequired = false;
            //hide fields to be completed for now...
            for (var formField in geocodingFieldVars.relatedFields) {

                var fieldToSet = jQuery("input[name='"+formField+"'],select[name='"+formField+"'],textarea[name='"+formField+"']");
                var holderToSet = jQuery(fieldToSet).closest("div.field");
                if(fieldToSet.attr("type") !== "hidden") {
                    if( ! holderToSet.hasClass(geocodingFieldVars.classForUncompletedField)) {
                        holderToSet.removeClass("show").addClass("hide");
                        var input = holderToSet.find("select[required='required'], input[required='required'], textarea[required='required']").each(
                            function(i, el) {
                                jQuery(el).attr("data-has-required", "yes").removeAttr("required");
                                makeItRequired = true;
                            }
                        );
                    }
                }
            }
            if(geocodingFieldVars.entryFieldHolder.is(":visible") && makeItRequired) {
                geocodingFieldVars.entryField.attr("required", "required");
                geocodingFieldVars.entryFieldHolder.attr("required", "required");
            }
            else {
                geocodingFieldVars.entryField.removeAttr("required");
                geocodingFieldVars.entryFieldHolder.removeAttr("required");
            }
        },

        /**
         * do the fields to be completed already have
         * values
         * @return Boolean
         */
        alreadyHasValues: function(){
            var empty = 0;
            var count = 0;
            //hide fields to be completed for now...
            for (var formField in geocodingFieldVars.relatedFields) {
                var fieldToSet = jQuery("input[name='"+formField+"'],select[name='"+formField+"'],textarea[name='"+formField+"']");
                var holderToSet = jQuery(fieldToSet).closest("div.field");
                jQuery(holderToSet).find("select, input, textarea").each(
                    function(i, el) {
                        count++;
                        if(jQuery(el).val() == "" || jQuery(el).val() == 0) {
                            empty++;
                        }
                    }
                );
            }
            if(empty / count <= geocodingFieldVars.percentageToBeCompleted) {
                return true;
            }
            return false;
        },

        /**
         * removes all the data from the address fields
         */
        clearFields: function(){
            //hide fields to be completed for now...
            for (var formField in geocodingFieldVars.relatedFields) {
                jQuery("#"+formField).find("select, input, textarea").val("");
            }
        },

        /**
         * shows the user that there is a result.
         *
         * @param string
         */
        setResults: function(resultAsYesOrNo) {
            return  geocodingFieldVars.entryField.attr("data-has-result", resultAsYesOrNo);
        },

        /**
         * tells us if results have been found
         *
         * @return Boolean
         */
        hasResults: function() {
            return geocodingFieldVars.entryField.attr("data-has-result") == "yes" ? true : false
        },

        /**
         * sets up all the various class options based on the current status
         */
        updateEntryFieldStatus: function() {
            var value =  geocodingFieldVars.entryField.val();
            var hasResult =  geocodingFieldVars.hasResults();
            var hasText = value.length > 1;
            if(hasResult) {
                geocodingFieldVars.entryFieldHolder.addClass(geocodingFieldVars.selectedClass);
                geocodingFieldVars.entryFieldHolder.removeClass(geocodingFieldVars.useMeClass);
                //swap links:
                geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.viewGoogleMapLinkSelector).show();

            }
            else{
                geocodingFieldVars.entryFieldHolder.removeClass(geocodingFieldVars.selectedClass);
                geocodingFieldVars.entryFieldHolder.addClass(geocodingFieldVars.useMeClass);
                //swap links:
                geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.viewGoogleMapLinkSelector).hide();
            }
            if(hasText) {
                geocodingFieldVars.entryField.addClass(geocodingFieldVars.hasTextClass);
            }
            else{
                geocodingFieldVars.entryField.removeClass(geocodingFieldVars.hasTextClass);
            }
        },

        /**
         *
         * @return NULL | String
         */
        getStaticMapImage: function(escapedLocation) {
            if(geocodingFieldVars.googleStaticMapLink) {
                var string = geocodingFieldVars.googleStaticMapLink;
                string = string.replace("[ADDRESS]", escapedLocation, "gi");
                string = string.replace("[ADDRESS]", escapedLocation, "gi");
                string = string.replace("[ADDRESS]", escapedLocation, "gi");
                var maxWidth = geocodingFieldVars.entryFieldHolder.find("input").outerWidth();				if(!maxWidth) {
                    maxWidth = geocodingFieldVars.defaultWidthOfStaticImage;
                }
                if(maxWidth) {
                    string = string.replace("[MAXWIDTH]", maxWidth, "gi");
                    string = string.replace("[MAXWIDTH]", maxWidth, "gi");
                }
                var maxHeight = maxWidth;
                if(!maxHeight) {
                    maxHeight = geocodingFieldVars.defaultHeightOfStaticImage;
                }
                if(maxHeight) {
                    string = string.replace("[MAXHEIGHT]", maxHeight, "gi");
                    string = string.replace("[MAXHEIGHT]", maxHeight, "gi");
                }
                return string;
            }
        },


        getfirstResult: function(predictions, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK)
            {
                var result = predictions[0];
                geocodingFieldVars.placesService.getDetails(
                    {
                        placeId:
                        result.place_id
                    },
                    geocodingFieldVars.loadExistingAddress
                );
            }
        },

        loadExistingAddress: function(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK)
            {
                geocodingFieldVars.fillInAddress(place);
            }
        },

        /**
         * look up default address and apply it
         *
         */
        loadDefaultAddress: function(){
            var myObject = this;
            var geocoder = new google.maps.Geocoder();
            var config = {};
            config['address'] = myObject.defaultAddress;
            geocoder.geocode(
                config,
                function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if(results.length > 0) {
                            myObject.fillInAddress(results[0]);
                        }
                    }
                }
            );
        }

    }


    // Expose public API
    return {
        getVar: function( variableName ) {
            if ( geocodingFieldVars.hasOwnProperty( variableName ) ) {
                return geocodingFieldVars[ variableName ];
            }
        },
        setVar: function(variableName, value) {
            for (var key in geocodingFieldVars) {
                if ( geocodingFieldVars.hasOwnProperty( key ) ) {
                    if ( key.toLowerCase() == variableName) {
                        geocodingFieldVars[key] = value;
                    }
                }
            }
            return this;
        },
        init: function(){
            geocodingFieldVars.init();
            return this;
        }

    }

}

Array.prototype.contains = function(array) {
    return array.every(
        function(item) {
            return this.indexOf(item) !== -1;
        },
        this
    );
}
