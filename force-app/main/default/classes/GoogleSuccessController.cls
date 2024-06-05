public class GoogleSuccessController {

    public GoogleSuccessController(ApexPages.StandardController c) {

    }

        @RemoteAction
        public static String gettoken(String currentUrl){
            try {
                System.debug('gettoken got invoked');
                String initialurl = currentUrl;
                String authcode = extractCodeParameter(initialurl);
                List<AuthProviderSettings__c> settingsList = [SELECT Id, ClientId__c, ClientSecret__c FROM AuthProviderSettings__c LIMIT 1];

                if (settingsList != null && !settingsList.isEmpty()) {
                    AuthProviderSettings__c settings = settingsList[0];
                    System.debug('setting: '+ settings);
                    String clientId = settings.ClientId__c;
                    System.debug('ClientId: ' + clientId);

                    String clientSecret = settings.ClientSecret__c;
                    System.debug('ClientSecret: ' + clientSecret);
                    String url = ''+System.Url.getOrgDomainUrl();
                    String REDIRECT_URI = '';
                    if(url.contains('develop.my.salesforce.com')) {
                        System.debug('System org url -->'+url);
                        String baseUrl = url.substringBeforeLast('.develop.my.salesforce.com');
                        baseUrl = baseUrl.substringAfter('Url:[delegate=');
                        REDIRECT_URI = baseUrl + '--c.develop.vf.force.com/apex/googleSuccessPage';
                    }else if(url.contains('sandbox.my.salesforce.com')){
                        System.debug('System org url -->'+url);
                        String baseUrl = url.substringBeforeLast('.sandbox.my.salesforce.com');
                        baseUrl = baseUrl.substringAfter('Url:[delegate=');
                        REDIRECT_URI = baseUrl + '--c.sandbox.vf.force.com/apex/googleSuccessPage';
                    }
                    else if(url.contains('scratch.my.salesforce.com')){
                        System.debug('System org url -->'+url);
                        String baseUrl = url.substringBeforeLast('.scratch.my.salesforce.com');
                        baseUrl = baseUrl.substringAfter('Url:[delegate=');
                        REDIRECT_URI = baseUrl + '--c.scratch.vf.force.com/apex/googleSuccessPage';
                    }else {
                        System.debug('System org url -->'+url);
                        String baseUrl = url.substringBeforeLast('.my.salesforce.com');
                        baseUrl = baseUrl.substringAfter('Url:[delegate=');
                        REDIRECT_URI = baseUrl + '--c.vf.force.com/apex/googleSuccessPage';
                    }
                    System.debug('redirect_uri-->'+REDIRECT_URI);
                    System.debug('Lets generate refresh token');
                    Map<String, String> tokens = generaterefreshtoken(clientid, clientsecret, REDIRECT_URI, authcode);
                    String refreshToken = tokens.get('refresh_token');
                    String accessToken = tokens.get('access_token');
                    
                    System.debug(refreshToken);
                    System.debug(accessToken);
                    if(refreshToken != null){
                        settings.refresh_token__c = refreshToken;
                        System.debug('ref');
                    }
                    if(accessToken != null){
                        settings.access_token__c = accessToken;
                        Date todaysDate = Date.today();
                        Datetime datetimeToday = Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 0, 0, 0);
                        String formattedDate = datetimeToday.format('dd/MM/yyyy');
                        System.debug('Today\'s Date ==>'+formattedDate);
                        settings.LinkedDate__c = formattedDate;
                        System.debug('acc');
                        String userdetails = fetchUserDetails(accessToken);
                        Map<String, Object> parsedResponse = (Map<String, Object>) JSON.deserializeUntyped(userdetails);
                        Map<String, Object> userObject = (Map<String, Object>) parsedResponse.get('user');
                        String emailAddress = (String) userObject.get('emailAddress');
                        System.debug('Email Address: ' + emailAddress);
                        String displayName = (String) userObject.get('displayName');
                        System.debug('Display Name: ' + displayName);
                        settings.username__c = displayName;
                        settings.email__c = emailAddress;
                        settings.WorkingStatus__c = true;
                        upsert settings;
                        return 'Success';
                    }
                 return 'maybe';
                } else {
                System.debug('nothing found');
                return 'Error';
                }
            } catch (Exception e) {
                Log_Handler.store_Exception(e, 'GoogleSuccessController', 'gettoken');
                System.debug('Exception of gettoken got invoked');
                return null;
            }
            
            
        }

        @RemoteAction
        public static PageReference redirectToSalesforcePage() {
            try {
                String url = ''+System.Url.getOrgDomainUrl();
            String REFRENCEURL = '';
            if(url.contains('develop.my.salesforce.com')) {
            System.debug('System org url -->'+url);
            String baseUrl = url.substringBeforeLast('.develop.my.salesforce.com');
            baseUrl = baseUrl.substringAfter('Url:[delegate=');
            REFRENCEURL = baseUrl + '.develop.lightning.force.com/lightning/n/Doc_Genius_Integration';
            }else if(url.contains('sandbox.my.salesforce.com')){
                System.debug('System org url -->'+url);
                String baseUrl = url.substringBeforeLast('.sandbox.my.salesforce.com');
                baseUrl = baseUrl.substringAfter('Url:[delegate=');
                REFRENCEURL = baseUrl + '.sandbox.lightning.force.com/lightning/n/Doc_Genius_Integration';
            }
            else if(url.contains('scratch.my.salesforce.com')){
                System.debug('System org url -->'+url);
                String baseUrl = url.substringBeforeLast('.scratch.my.salesforce.com');
                baseUrl = baseUrl.substringAfter('Url:[delegate=');
                REFRENCEURL = baseUrl + '.scratch.lightning.force.com/lightning/n/Doc_Genius_Integration';
            }else {
                System.debug('System org url -->'+url);
                String baseUrl = url.substringBeforeLast('.my.salesforce.com');
                baseUrl = baseUrl.substringAfter('Url:[delegate=');
                REFRENCEURL = baseUrl + '.force.com/lightning/n/Doc_Genius_Integration';
            }
            System.debug(REFRENCEURL);
            PageReference pageRef = new PageReference(REFRENCEURL); // Replace 'TargetPageName' with the name of your target Visualforce page
            return pageRef;
            } catch (Exception e) {
                Log_Handler.store_Exception(e, 'GoogleSuccessController', 'redirectToSalesforcePage');
                System.debug('Exception of redirectToSalesforcePage got invoked');
                return null;
            }
        }
    
        public static String extractCodeParameter(String url) {
            // Replace the base URL with an empty string to get the relative path
            try {
                String relativePath = url.replace(System.Url.getSalesforceBaseUrl().toExternalForm(), '');
                // Use the PageReference class to extract query parameters
                PageReference pageRef = new PageReference(relativePath);
                String codeParameter = pageRef.getParameters().get('code');
                Integer index = codeParameter.indexOf('%2F');
                if (index == 1) {
                    // Replace '%2F' with '/'
                    codeParameter = codeParameter.substring(0, index) + '/' + codeParameter.substring(index + 3);
                }
                System.debug(codeParameter);
                return codeParameter;
            } catch (Exception e) {
                Log_Handler.store_Exception(e, 'GoogleSuccessController', 'extractCodeParameter');
                System.debug('Exception of extractCodeParameter got invoked');
                return null;
            }
            
        }
    
        public static Map<String, String> generaterefreshtoken(String client_id, String client_secret, String REDIRECT_URI, String authcode){
            try {
                // String SCOPE = 'https://www.googleapis.com/auth/drive.file';
                String SCOPE = 'openid email profile https://www.googleapis.com/auth/drive';
                String ENDPOINT = 'https://oauth2.googleapis.com/token';
                HttpRequest request = new HttpRequest();
                request.setEndpoint(ENDPOINT);
                request.setMethod('POST');
                request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
                request.setHeader('Accept-Encoding', 'gzip, deflate, br');
                request.setHeader('Connection', 'keep-alive');
                System.debug(authcode);
                request.setBody('code=' + authcode +
                                '&client_id=' + client_id +
                                '&client_secret=' + client_secret +
                                '&redirect_uri=' + REDIRECT_URI +
                                '&grant_type=authorization_code');

                Http http = new Http();
                HttpResponse response = http.send(request);

                // Parse the response and extract refresh token
                Map<String, String> result = new Map<String, String>();
                System.debug(response.getStatusCode());
                System.debug(response.getBody());
                if (response.getStatusCode() == 200) {
                    Map<String, Object> jsonResponse = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                    // System.debug(jsonResponse);
                    System.debug('access token : '+(String) jsonResponse.get('access_token'));
                    System.debug('refresh token : '+(String) jsonResponse.get('refresh_token'));
                    result.put('refresh_token', (String) jsonResponse.get('refresh_token'));
                    result.put('access_token', (String) jsonResponse.get('access_token'));

                } else {
                    // Handle error response
                    result.put('error', 'Error obtaining refresh token & access token. HTTP Status Code: ' + response.getStatusCode() +
                                        ', Response Body: ' + response.getBody());
                }
                return result;
            } catch (Exception e) {
                Log_Handler.store_Exception(e, 'GoogleSuccessController', 'generaterefreshtoken');
                System.debug('Exception of generaterefreshtoken got invoked');
                return null;
            }
            
    }

    public static HttpRequest getuserdata(String acctok){
        try {
            HttpRequest req= new HttpRequest();
            req.setEndpoint('https://www.googleapis.com/drive/v3/about?fields=user');
            req.setHeader('Authorization', 'Bearer ' + acctok);
            req.setMethod('GET');
            return req;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GoogleSuccessController', 'getuserdata');
            System.debug('Exception of getuserdata got invoked');
            return null;
        }
        
        
    }

    @AuraEnabled
    public static String fetchUserDetails(String access) {
        try {
            String acctok = access;
            HttpRequest req = getuserdata(acctok);

            HttpResponse resp = sendHttpRequest(req);
            
            if (resp.getStatusCode() == 200) {
                String resbody = resp.getBody();
                String respbody = resbody != null ? resbody : '';
                return respbody;
            }
            else{
                return 'false';
            }
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GoogleSuccessController', 'fetchUserDetails');
            System.debug('Exception of fetchUserDetails got invoked');
            return null;
        }
        
        
    }

    private static HttpResponse sendHttpRequest(HttpRequest req) {
        try {
            Http h = new Http();
            req.setTimeout(60000);
            return h.send(req);
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GoogleSuccessController', 'sendHttpRequest');
            System.debug('Exception of sendHttpRequest got invoked');
            return null;
        }
    }
}