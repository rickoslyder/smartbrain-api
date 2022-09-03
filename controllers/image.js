const fetch = require("node-fetch");

const USER_ID = 'localblackguy';
// Your PAT (Personal Access Token) can be found in the portal under Authentication
const PAT = '2c8697350ea7401b889eea81bf05c715';
const APP_ID = 'my-first-application';
// Change these to whatever model and image URL you want to use
const MODEL_ID = 'face-detection';
// const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';    

const handleFaceDetectApiCall = () => (req, res) => {
    const IMAGE_URL = req.body.input;
    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });
    
    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };

    fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/outputs", requestOptions)
    .then(response => response.json())
    .then(response => {
        if (response) {
            res.json(response)
        } else {
            res.json("Backend error: Face detection failed - please try again")
        }
    }).catch(err => res.json("Backend error: Face detection failed - please try again"))
}

module.exports = {
    handleFaceDetectApiCall: handleFaceDetectApiCall
}