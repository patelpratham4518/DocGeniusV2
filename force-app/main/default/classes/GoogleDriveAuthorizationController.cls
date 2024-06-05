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
    public static String redirectUrl(){
            try {
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
                return REDIRECT_URI;
            } catch (Exception e) {
                Log_Handler.store_Exception(e, 'GoogleDriveAuthorizationController', 'redirectUrl');
                System.debug('Exception of redirecturl got invoked');
                return null;
            }
            
    }

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

    public static String authcode(String clientId, String clientSecret){
        try {
            String REDIRECT_URI = redirectUrl();
            // String REDIRECT_URI = extractedString;
            String AUTH_URL = 'https://accounts.google.com/o/oauth2/auth';
            String GOOGLE_DRIVE_SCOPE = 'openid email profile https://www.googleapis.com/auth/drive';
            String authUrl = AUTH_URL + '?response_type=code' +
                            '&client_id=' + clientId +
                            '&redirect_uri=' + REDIRECT_URI +
                            '&access_type=offline' +
                            '&approval_prompt=force'+
                            '&state=state_parameter_passthrough_value' +
                            '&scope=' + GOOGLE_DRIVE_SCOPE;
            return authUrl;
            } catch (Exception e) {
                Log_Handler.store_Exception(e, 'GoogleDriveAuthorizationController', 'authcode');
                System.debug('Exception of authcode got invoked');
                return null;
            }
    }
}