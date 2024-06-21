public with sharing class GoogleDriveAuthorizationController {
    @AuraEnabled
    public static Map<String, Object> checkgoogleauth(){
        try{
            AuthProviderSettings__c settings = AuthProviderSettings__c.getInstance();
            Map<String, Object> result = new Map<String, Object>();
            if (settings != null && settings.refresh_token__c != null && settings.access_token__c != null && settings.username__c != null && settings.email__c != null && settings.LinkedDate__c != null) {
                    result.put('name', settings.username__c);
                    result.put('email', settings.email__c);
                    result.put('linkdate', settings.LinkedDate__c);
                    result.put('active', settings.WorkingStatus__c);
                return result;
            }
            result.put('error', 'Error obtaining details: ');
            return result;
        }catch(Exception e){
            Log_Handler.store_Exception(e, 'GoogleDriveAuthorizationController', 'checkgoogleauth');
            System.debug('Exception of checkgoogleauth got invoked');
            return null;
        }
    }

    @AuraEnabled
    public static String getAuthCode(String clientId, String clientSecret) {
        if (String.isBlank(clientId) || String.isBlank(clientSecret)) {
            return 'Both Client ID and Client Secret are required.';
        }

        AuthProviderSettings__c settings = AuthProviderSettings__c.getInstance();
        if (settings == null) {
            settings = new AuthProviderSettings__c();
        }

        settings.ClientId__c = clientId;
        settings.ClientSecret__c = clientSecret;

        String durl = authcode(clientId, clientSecret);
        upsert settings;
        System.debug('This is url-->'+durl);
        return durl;
    }

    public static String authcode(String clientId, String clientSecret){
        String AUTH_URL = 'https://accounts.google.com/o/oauth2/auth';
        String REDIRECT_URI = 'https://mvclouds17-dev-ed.develop.my.salesforce-sites.com/';  //REPLACE IT WITH VFPAGE URL
        String GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
        String authUrl = AUTH_URL + '?response_type=code' +
                        '&client_id=' + clientId +
                        '&redirect_uri=' + REDIRECT_URI +
                        '&access_type=offline' +
                        '&approval_prompt=force'+
                        '&state=state_parameter_passthrough_value' +
                        '&scope=' + GOOGLE_DRIVE_SCOPE;
        return authUrl;
    }

    @AuraEnabled
    public static String authorizeGoogle(String authcode){
        AuthProviderSettings__c settings = AuthProviderSettings__c.getInstance();
            string client_id = settings.ClientId__c;
            string client_secret = settings.ClientSecret__c;
            String REDIRECT_URI = 'https://mvclouds17-dev-ed.develop.my.salesforce-sites.com/';

            
        Map<String, String> result = generaterefreshtoken(client_id, client_secret, REDIRECT_URI, authcode);
        String refresh = result.get('refresh_token');
        String access = result.get('access_token');
        if(refresh != null){
            settings.refresh_token__c = refresh;
            if(access != null){
                settings.access_token__c = access;
                Date todaysDate = Date.today();
                Datetime datetimeToday = Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 0, 0, 0);
                String formattedDate = datetimeToday.format('dd/MM/yyyy');
                System.debug('Today\'s Date ==>'+formattedDate);
                settings.LinkedDate__c = formattedDate;
                System.debug('acc');
                String userdetails = fetchUserDetails(access);
                Map<String, Object> parsedResponse = (Map<String, Object>) JSON.deserializeUntyped(userdetails);
                System.debug('Parsed response-->'+parsedResponse);
                Map<String, Object> userObject = (Map<String, Object>) parsedResponse.get('user');
                System.debug('Parsed response-->'+userObject);
                String emailAddress = (String) userObject.get('emailAddress');
                System.debug('Email Address: ' + emailAddress);
                String displayName = (String) userObject.get('displayName');
                System.debug('Display Name: ' + displayName);
                String userPhoto = (String) userObject.get('photoLink');
                settings.photolink__c = userPhoto;
                settings.username__c = displayName;
                settings.email__c = emailAddress;
                settings.WorkingStatus__c = true;
            }
            upsert settings;
            return 'success';
        }
        else{
            return 'fail';
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

    public static Map<String, String> generaterefreshtoken(String client_id, String client_secret, String REDIRECT_URI, String authcode){
            String SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
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
            System.debug(result);

            return result;
        }

    // @AuraEnabled
    // public static String redirectUrl(){
    //         try {
    //             String url = ''+System.Url.getOrgDomainUrl();
    //             String REDIRECT_URI = '';
    //             if(url.contains('develop.my.salesforce.com')) {
    //             System.debug('System org url -->'+url);
    //             String baseUrl = url.substringBeforeLast('.develop.my.salesforce.com');
    //             baseUrl = baseUrl.substringAfter('Url:[delegate=');
    //             REDIRECT_URI = baseUrl + '--c.develop.vf.force.com/apex/googleSuccessPage';
    //             }else if(url.contains('sandbox.my.salesforce.com')){
    //                 System.debug('System org url -->'+url);
    //                 String baseUrl = url.substringBeforeLast('.sandbox.my.salesforce.com');
    //                 baseUrl = baseUrl.substringAfter('Url:[delegate=');
    //                 REDIRECT_URI = baseUrl + '--c.sandbox.vf.force.com/apex/googleSuccessPage';
    //             }
    //             else if(url.contains('scratch.my.salesforce.com')){
    //                 System.debug('System org url -->'+url);
    //                 String baseUrl = url.substringBeforeLast('.scratch.my.salesforce.com');
    //                 baseUrl = baseUrl.substringAfter('Url:[delegate=');
    //                 REDIRECT_URI = baseUrl + '--c.scratch.vf.force.com/apex/googleSuccessPage';
    //             }else {
    //                 System.debug('System org url -->'+url);
    //                 String baseUrl = url.substringBeforeLast('.my.salesforce.com');
    //                 baseUrl = baseUrl.substringAfter('Url:[delegate=');
    //                 REDIRECT_URI = baseUrl + '--c.vf.force.com/apex/googleSuccessPage';
    //             }
    //             return REDIRECT_URI;
    //         } catch (Exception e) {
    //             Log_Handler.store_Exception(e, 'GoogleDriveAuthorizationController', 'redirectUrl');
    //             System.debug('Exception of redirecturl got invoked');
    //             return null;
    //         }
            
    // }

    @AuraEnabled
    public static Boolean unauthorize(){
        try {
            AuthProviderSettings__c settings = AuthProviderSettings__c.getInstance();
        if(settings != null){
            settings.ClientId__c = '';
            settings.ClientSecret__c = '';
            settings.username__c = '';
            settings.LinkedDate__c = '';
            settings.email__c = '';
            settings.refresh_token__c = '';
            settings.access_token__c = '';
            settings.WorkingStatus__c = false;
            upsert settings;
            return true;
        }
        return false;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GoogleDriveAuthorizationController', 'unauthorize');
            System.debug('Exception of unauthorize got invoked');
            return null;
        }
        
    }



    @AuraEnabled
    public static String authorize(String clientId, String clientSecret) {
        // Validate inputs (you may want to add more validation logic)
        try {
            if (String.isBlank(clientId) || String.isBlank(clientSecret)) {
            return 'Both Client ID and Client Secret are required.';
            }

            AuthProviderSettings__c settings = AuthProviderSettings__c.getInstance();
            if (settings == null) {
                settings = new AuthProviderSettings__c();
            }

            settings.ClientId__c = clientId;
            settings.ClientSecret__c = clientSecret;

            String durl = authcode(clientId, clientSecret);
            upsert settings;
            System.debug('This is url-->'+durl);
            return durl;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'GoogleDriveAuthorizationController', 'authorize');
            System.debug('Exception of authorize got invoked');
            return null;
        }
        
    }

    // public static String authcode(String clientId, String clientSecret){
    //     try {
    //         String REDIRECT_URI = 'https://mvclouds17-dev-ed.develop.my.salesforce-sites.com/';
    //         // String REDIRECT_URI = extractedString;
    //         String AUTH_URL = 'https://accounts.google.com/o/oauth2/auth';
    //         String GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
    //         String authUrl = AUTH_URL + '?response_type=code' +
    //                         '&client_id=' + clientId +
    //                         '&redirect_uri=' + REDIRECT_URI +
    //                         '&access_type=offline' +
    //                         '&approval_prompt=force'+
    //                         '&state=state_parameter_passthrough_value' +
    //                         '&scope=' + GOOGLE_DRIVE_SCOPE;
    //         return authUrl;
    //         } catch (Exception e) {
    //             Log_Handler.store_Exception(e, 'GoogleDriveAuthorizationController', 'authcode');
    //             System.debug('Exception of authcode got invoked');
    //             return null;
    //         }
    // }
}