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
        type_to_be_returned: 'address',

        /**
         * make sure to match with `type_to_be_returned`
         * @see: https://developers.google.com/maps/documentation/geocoding/intro
         * @type string
         */
        componentType: 'street_address',

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
            geocodingFieldVars.entryField = jQuery('input[name="'+geocodingFieldVars.fieldName+'"]');
            geocodingFieldVars.entryFieldHolder = jQuery(geocodingFieldVars.entryField).closest("div.field");
            geocodingFieldVars.entryFieldRightLabel = geocodingFieldVars.entryFieldHolder.find('label.right');
            geocodingFieldVars.entryFieldLeftLabel = geocodingFieldVars.entryFieldHolder.find('label.left');

            //move the "use geocoding link"
            var linkToMove = "#" + geocodingFieldVars.entryFieldHolder.attr("ID") + " " + geocodingFieldVars.returnSelector;
            var relatedReturnLink = jQuery(linkToMove);

            //clean up affected fields
            //geocodingFieldVars.clearFields();
            geocodingFieldVars.hideFields();

            //set basic classes for input field

            geocodingFieldVars.setResults("no");
            geocodingFieldVars.updateEntryFieldStatus();

            //set up auto-complete stuff
            var fieldID = geocodingFieldVars.entryField.attr("id");
            var config = { type: geocodingFieldVars.type_to_be_returned };
            if(geocodingFieldVars.restrictToCountryCode){
                config.componentRestrictions = {'country' : geocodingFieldVars.restrictToCountryCode};
            }
            geocodingFieldVars.autocomplete = new google.maps.places.Autocomplete(
                document.getElementById(fieldID),
                config
            );
            google.maps.event.addListener(
                geocodingFieldVars.autocomplete,
                'place_changed',
                function() {
                    geocodingFieldVars.fillInAddress();
                }
            );

            //add listeners
            geocodingFieldVars.entryField
                .focus(
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
                        if (code == 13 ) return false;
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
            //bypass
            geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.bypassSelector).click(
                function(e){
                    e.preventDefault();
                    geocodingFieldVars.showFields();
                    geocodingFieldVars.entryFieldHolder.hide();
                    return false;
                }
            );
            //return
            jQuery(relatedReturnLink).click(
                function(e){
                    e.preventDefault();
                    geocodingFieldVars.hideFields();
                    geocodingFieldVars.entryFieldHolder.show();
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
                //to do - to be completed!
                geocodingFieldVars.entryField.attr("placeholder", geocodingFieldVars.entryField.val());;
                geocodingFieldVars.entryField.val("")
                //google.maps.event.trigger(geocodingFieldVars.autocomplete, 'place_changed');
                //console.debug(geocodingFieldVars.autocomplete);
            }
            if(typeof geocodingFieldVars.defaultAddress === "string") {
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

        fillInAddress: function() {
            var updated = false;
            if(typeof place === 'undefined') {
                var place = geocodingFieldVars.autocomplete.getPlace();
            }
            geocodingFieldVars.entryField.attr("data-has-result", "no");
            if(geocodingFieldVars.debug) {console.log(place);}
            //if(geocodingFieldVars.debug) {console.log(geocodingFieldVars.autocomplete);}
            var placeIsSpecificEnough = false;
            if(typeof place !== 'undefined') {
                var addressComponents = place.address_components;
                if(typeof addressComponents === 'undefined') {
                    addressComponents = place.types;
                }
                for (var i = 0; i < addressComponents.length; i++) {
                    var types = addressComponents[i].types;
                    for (var j = 0; j < types.length; j++) {
                        var type = types[j];
                    }
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
                }
            }
        },

        /**
         * shows the address fields
         */
        showFields: function(){
            for (var formField in geocodingFieldVars.relatedFields) {
                var fieldToSet = jQuery("input[name='"+formField+"'],select[name='"+formField+"'],textarea[name='"+formField+"']");
                var holderToSet = jQuery(fieldToSet).closest("div.field");
                if(fieldToSet.attr("type") !== "hidden") {
                    holderToSet.removeClass("hide").addClass("show");
                    var input = holderToSet.find("select[data-has-required='yes'], input[data-has-required='yes']").each(
                        function(i, el) {
                            jQuery(el).attr("required", "required").removeAttr("data-has-required");
                        }
                    );
                }
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
                geocodingFieldVars.entryField.addClass(geocodingFieldVars.selectedClass);
                geocodingFieldVars.entryField.removeClass(geocodingFieldVars.useMeClass);
                //swap links:
                geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.viewGoogleMapLinkSelector).show();
                geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.bypassSelector).hide();
            }
            else{
                geocodingFieldVars.entryField.removeClass(geocodingFieldVars.selectedClass);
                geocodingFieldVars.entryField.addClass(geocodingFieldVars.useMeClass);
                //swap links:
                geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.viewGoogleMapLinkSelector).hide();
                geocodingFieldVars.entryFieldHolder.find(geocodingFieldVars.bypassSelector).show();
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


        /**
         * look up default address and apply it
         *
         */
        loadDefaultAddress: function(){
            var myObject = this;
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode(
                { this.componentType: myObject.defaultAddress},
                function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if(results.length > 0) {
                            myObject.fillInAddress(results[0]);
                        }
                    }
                }
            );
            return "for bar";
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
