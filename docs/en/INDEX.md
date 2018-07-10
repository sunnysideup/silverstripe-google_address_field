Google Address Field
================================================================================


[![Build Status](https://travis-ci.org/sunnysideup/silverstripe-google_address_field.svg?branch=master)](https://travis-ci.org/sunnysideup/silverstripe-google_address_field)

Provides an Auto-Complete field for addresses using the Google API.

see:
 * [Example](https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-addressform)

* [Documentation](https://developers.google.com/maps/documentation/javascript/places-autocomplete#address_forms)


Developer
-----------------------------------------------
Nicolaas Francken [at] sunnysideup.co.nz


Requirements
-----------------------------------------------
see composer.json


Installation Instructions
-----------------------------------------------
1. Add module as per usual.

2. Review configs and add entries to `mysite/\_config/google_address_field.yml`
(or similar) as necessary.
In the `\_config/` folder of this module
you can usually find some examples of config options (if any).

3. The way this field works is that it replaces existing fields, but to add it. After that you can  use the `setFieldMap` method to map your existing fields to data returned by Google. Here is a very basic example on how to place all the data into one field:
```php
    $fields->insertBefore(
        $addressField = new GoogleAddressField("AddressLookup", "Physical Address"),
        "Address"
    );
    $addressField->setFieldMap(array("Address" => array("formatted_address" => "long_name")));
```

4. In the JS you can turn on `debug` which will show a wealth of information in the console (F12 is your friend).

Conflict with fastclick.js
-----------------------------------------------
If you are using fastclick.js on your website please note that it will cause a conflict with the google address lookup field that prevents addresses from being selectable on iOS devices.
The following code can be used to resolve this conflict:
```php
            var needsClick = FastClick.prototype.needsClick;
            FastClick.prototype.needsClick = function(target) {
                if ( (target.className || '').indexOf('pac-item') > -1 ) {
                    return true;
                }
                else if ( (target.parentNode.className || '').indexOf('pac-item') > -1) {
                    return true;
                }
                else {
                    return needsClick.apply(this, arguments);
                }
            };
            FastClick.attach(document.body);
```
API Key
-----------------------------------------------

To use this project you will need to make sure you API key is enabled for the following services:
-Geocoder
-Maps
-PlacesService
