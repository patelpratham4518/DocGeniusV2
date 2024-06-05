public with sharing class OneDriveAuthorizationController {

    @AuraEnabled
    public static Map<String, Object> checkonedriveauth(){
        try {
            OneDriveAuthProviderSettings__c settings = OneDriveAuthProviderSettings__c.getInstance();
            Map<String, Object> result = new Map<String, Object>();
            if (settings != null && settings.refresh_token__c != null && settings.access_token__c != null && settings.email__c != null && settings.LinkedDate__c != null) {
                result.put('email', settings.email__c);
                result.put('linkdate', settings.LinkedDate__c);
                result.put('active', settings.WorkingStatus__c);
                result.put('name', settings.username__c);
                return result;
            }
            result.put('error', 'Error obtaining details: ');
            return result;

        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'OneDriveAuthorizationController', 'checkonedriveauth');
            System.debug('Exception of checkonedriveauth got invoked');
            return null;
        }
    }

    @AuraEnabled
    public static Boolean unauthorize(){
        try {
            OneDriveAuthProviderSettings__c	 settings = OneDriveAuthProviderSettings__c.getInstance();
        if(settings != null){
            settings.access_token__c = '';
            settings.access_token1__c = '';
            settings.access_token2__c = '';
            settings.access_token3__c = '';
            settings.access_token4__c = '';
            settings.ClientId__c = '';
            settings.ClientSecret__c = '';
            settings.LinkedDate__c = '';
            settings.WorkingStatus__c = false;
            settings.username__c = '';
            settings.refresh_token__c = '';
            settings.refresh_token1__c = '';
            settings.email__c = '';
            upsert settings;
            return true;
        }
        return false;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'OneDriveAuthorizationController', 'unauthorize');
            System.debug('Exception of unauthorize got invoked');
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
                REDIRECT_URI = baseUrl + '--c.develop.vf.force.com/apex/oneDriveSuccessPage';
                }else if(url.contains('sandbox.my.salesforce.com')){
                    System.debug('System org url -->'+url);
                    String baseUrl = url.substringBeforeLast('.sandbox.my.salesforce.com');
                    baseUrl = baseUrl.substringAfter('Url:[delegate=');
                    REDIRECT_URI = baseUrl + '--c.sandbox.vf.force.com/apex/oneDriveSuccessPage';
                }else if(url.contains('scratch.my.salesforce.com')){
                    System.debug('System org url -->'+url);
                    String baseUrl = url.substringBeforeLast('.scratch.my.salesforce.com');
                    baseUrl = baseUrl.substringAfter('Url:[delegate=');
                    REDIRECT_URI = baseUrl + '--c.scratch.vf.force.com/apex/oneDriveSuccessPage';
                }else {
                    System.debug('System org url -->'+url);
                    String baseUrl = url.substringBeforeLast('.my.salesforce.com');
                    baseUrl = baseUrl.substringAfter('Url:[delegate=');
                    REDIRECT_URI = baseUrl + '--c.vf.force.com/apex/oneDriveSuccessPage';
                }
                return REDIRECT_URI;
            } catch (Exception e) {
                Log_Handler.store_Exception(e, 'OneDriveAuthorizationController', 'redirectUrl');
                System.debug('Exception of redirecturl got invoked');
                return null;
            }
            
    }


    @AuraEnabled
    public static String authorize(String clientId, String clientSecret) {
        if (String.isBlank(clientId) || String.isBlank(clientSecret) ) {
            return 'Both Client ID and Client Secret are required.';
        }

        OneDriveAuthProviderSettings__c settings = OneDriveAuthProviderSettings__c.getInstance();
        if (settings == null) {
            settings = new OneDriveAuthProviderSettings__c();
        }
        settings.ClientId__c = clientId;
        settings.ClientSecret__c = clientSecret;

        String durl = authcode(clientId, clientSecret);
        upsert settings;
        System.debug(durl);
        return durl;
    }

    public static String authcode(String clientId, String clientSecret){
        String REDIRECT_URI = redirectUrl();
        String AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
        String ONE_DRIVE_SCOPES = 'files.readwrite.All offline_access User.Read';
        String authUrl = AUTH_URL + '?response_type=code' +
                        '&client_id=' + clientId +
                        '&redirect_uri=' + REDIRECT_URI +
                        '&access_type=offline' +
                        '&state=state_parameter_passthrough_value' +
                        '&scope=' + ONE_DRIVE_SCOPES +
                        '&response_mode=query' +
                        '&prompt=login';

        return authUrl;
    }
}