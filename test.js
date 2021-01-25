var axios = require('axios');

var config = {
  method: 'get',
  url: 'https://fotonicia.com/rest/default/V1/customers/me',
  headers: { 
    'Authorization': 'Bearer lh1i3010aevanntu986ec4vnle8jjll7', 
    'Content-Type': 'application/json', 
    'Cookie': 'store=default; PHPSESSID=nnfpe5238bjvdvmuqm7vhff7e0'
  }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
