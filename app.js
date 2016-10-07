var express = require("express");
var bodyParser = require("body-parser");
var crypto = require("crypto");
var app = express();

app.use(bodyParser.json());

// define the validate endpoint accepting HTTP POST
app.post("/validate", function(req, res) {
    return validate(req, res);
});

// listen on port 3000
var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});

// The message format validation function
function validate(req, res) {
    // req: the request payload
    // res: the response

    // the request body
    var body = req.body;
    
    // your Realtime private key
    var privateKey = "ENTER-YOUR-REALTIME-PRIVATEKEY-HERE";
    
    // compute the SHA256 HMAC digest of the request body
    var signature = crypto.createHmac("SHA256", privateKey).update(JSON.stringify(body)).digest('hex');
    
    // get the webhook triggers array
    var triggers = req.body.triggers;
    
    // iterate through all the triggers
    for(var t = 0; t < triggers.length; t++) {
        var isValid = false;

        // compare the signatures
        if(signature === req.get('x-realtime-signature')) {
            // signature is valid
            // check if the trigger message has all the required fields
            try {
                var message = JSON.parse(triggers[t].message);
                if((message.sender && message.timestamp > 0 && message.text)) {
                    isValid = true;
                }
            }
            catch(e) {
                // message is not valid
            }
            finally {
                if(isValid) {
                    // the message is valid
                    triggers[t].statusCode = 200;
                } else {
                    // the message is invalid
                    // return an exception
                    triggers[t].statusCode = 400;
                    triggers[t].message = "Message is not valid"
                }
            }
        } else {
            // the message signature is not valid
            // return an exception
            triggers[t].statusCode = 403;
            triggers[t].message = "Message signature is not valid"
        }
    }

    // return the response payload

    // note that for simplicity we are using the same triggers array
    // we have received in the request

    return res.status(200).send(triggers);
}


