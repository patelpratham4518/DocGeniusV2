public with sharing class AwsAuthorizationController {

    @AuraEnabled
    public static Map<String, Object> checkawsauth(){
        try{
            AwsAuthProviderSettings__c settings = AwsAuthProviderSettings__c.getInstance();
            Map<String, Object> result = new Map<String, Object>();
            if (settings != null && settings.ClientId__c != null && settings.ClientSecret__c != null && settings.BucketName__c != null && settings.LinkedDate__c != null) {
                    result.put('bucket', settings.BucketName__c);
                    result.put('linkdate', settings.LinkedDate__c);
                    result.put('active', settings.WorkingStatus__c);
                    result.put('name', settings.NickName__c);
                return result;
            }
            result.put('error', 'Error obtaining details: ');
            return result;
        }catch(Exception e){
            Log_Handler.store_Exception(e, 'AwsAuthorizationController', 'checkawsauth');
            System.debug('Exception of checkawsauth got invoked');
            return null;
        }
    }

    @AuraEnabled
    public static Boolean unauthorize(){
        try {
            AwsAuthProviderSettings__c settings = AwsAuthProviderSettings__c.getInstance();
        if(settings != null){
            settings.BucketName__c = '';
            settings.ClientId__c = '';
            settings.ClientSecret__c = '';
            settings.LinkedDate__c = '';
            settings.WorkingStatus__c = false;
            settings.NickName__c = '';
            upsert settings;
            return true;
        }
        return false;
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'AwsAuthorizationController', 'unauthorize');
            System.debug('Exception of unauthorize got invoked');
            return null;
        }
        
    }


    @AuraEnabled
    public static String authorize(String clientId, String clientSecret, String bucket, String awsNickname) {
        try {
            if (String.isBlank(clientId) || String.isBlank(clientSecret) || String.isBlank(bucket) || String.isBlank(awsNickname)) {
            System.debug('looks fishy');
            return 'All Details are compulsory';
            }

            AwsAuthProviderSettings__c settings = AwsAuthProviderSettings__c.getInstance();
            if (settings == null) {
                settings = new AwsAuthProviderSettings__c();
            }
            settings.ClientId__c = clientId;
            settings.ClientSecret__c = clientSecret;
            settings.BucketName__c = bucket;
            settings.NickName__c = awsNickname;
            Date todaysDate = Date.today();
            Datetime datetimeToday = Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 0, 0, 0);
            String formattedDate = datetimeToday.format('dd/MM/yyyy');
            System.debug('Today\'s Date ==>'+formattedDate);
            settings.LinkedDate__c = formattedDate;
            settings.WorkingStatus__c = true;


            Boolean status = UploadDocuments(bucket, clientId, clientSecret);

            if(status)
            {
                System.debug('before upsert');
                upsert settings;
                return 'Success';
            }
            else{
                System.debug('auth failed');
                return 'Failure';
            }
            
            
        } catch (Exception e) {
            Log_Handler.store_Exception(e, 'AwsAuthorizationController', 'authorize');
            System.debug('Exception of authorize got invoked');
            return null;
        }
        
    }

    public static string createAuthHeader(string contentType, string filename, string formatedDateString, string fileExtension, String methodName, String bucketName, String awsKey, String awsSecret){
        System.debug('1-->'+contentType);
        System.debug('2-->'+filename);
        System.debug('3-->'+formatedDateString);
        System.debug('4-->'+fileExtension);
        System.debug('5-->'+methodName);
        System.debug('6-->'+bucketName);
        System.debug('7-->'+awsKey);
        System.debug('8-->'+awsSecret);
        string auth;
        string stringToSign = methodName+'\n\n'+contentType+'\n'+formatedDateString+'\n/'+bucketName+'/'+fileName.toLowerCase()+'.'+fileExtension.toLowerCase();
        Blob mac = Crypto.generateMac('HMACSHA1', blob.valueOf(stringToSign), blob.valueOf(awsSecret));
        string sig = EncodingUtil.base64Encode(mac);
        auth = 'AWS'+' '+awsKey+':'+sig;
        System.debug('Auth header created');
        return auth;
    }

    public static Blob generateDummyFileData() {
        // Generate some dummy data (e.g., text content)
        String dummyContent = 'This is a dummy file.';
        return Blob.valueOf(dummyContent);
    }

    @AuraEnabled
    public static Boolean UploadDocuments(String bucketName, String clientid, String clientsecret){
            String hostName = 's3.amazonaws.com';
            String methodName = 'PUT';

            Blob fileData = generateDummyFileData();

            String fileExtension = 'txt';
        
            // Set the file name
            String fileName = 'dummyfile';
            
            // Set the content type
            String contentType = 'text/plain';
            
            // Call the uploadToS3 method with generated data                

        String fileUrl = 'https://' + bucketName + '.' + hostName + '/' + fileName + '.txt';
        
        // Generate the formatted date string
        String formatedDateString = Datetime.now().formatGMT('EEE, dd MMM yyyy HH:mm:ss z');
        
        // Create the authorization header
        String authHeader = createAuthHeader(contentType, fileName, formatedDateString, fileExtension, methodName, bucketName, clientid, clientsecret);
        
        // Create the HTTP request
        HttpRequest req = new HttpRequest();
        req.setMethod(methodName);
        req.setEndpoint(fileUrl);
        req.setHeader('Content-Length', String.valueOf(fileData.size()));
        req.setHeader('Host', bucketName + '.' + hostName);
        req.setHeader('Content-Type', contentType);
        req.setHeader('Date', formatedDateString);
        req.setHeader('Authorization', authHeader);
        req.setBodyAsBlob(fileData);
        
        // Send the request
        Http h = new Http();
        HttpResponse res = h.send(req);
        
        // Check the response
        if (res.getStatusCode() == 200) {
            System.debug('File uploaded successfully to AWS S3');
            deleteFile(bucketName, clientsecret, clientid);
            return true;
            
        } else {
            System.debug('Error message =>' + res.getBody());
            System.debug('Failed to upload file to AWS S3. HTTP Status: ' + res.getStatus());
            return false;
        }
    }

    public static void deleteFile(String bucketName, String secret, String access) {
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://' + bucketName + '.' + 's3.amazonaws.com' + '/' + 'dummyfile' + '.txt');
        request.setMethod('DELETE');

        String formatedDateString = Datetime.now().formatGMT('EEE, dd MMM yyyy HH:mm:ss z');
        
        // Add AWS authentication headers
        String awsAuthHeader = createAuthHeader('text/plain', 'dummyfile', formatedDateString, 'txt', 'DELETE', bucketName, access, secret);
        request.setHeader('Authorization', awsAuthHeader);
        request.setHeader('Host', bucketName + '.' + 's3.amazonaws.com');
        request.setHeader('Content-Type', 'text/plain');
        request.setHeader('Date', formatedDateString);
        
        // Perform HTTP callout
        Http http = new Http();
        HttpResponse response = http.send(request);
        
        // Check the response
        if (response.getStatusCode() == 204) {
            System.debug('File deleted successfully.');
        } else {
            System.debug('Error deleting file: ' + response.getBody());
        }
    }

public static Blob generateDummyImageData() {
    // Base64 encoded data for a simple 1x1 black JPEG image
    String base64ImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAeRXhpZgAATU0AKgAAAAgAA4BMVAAPAAAABAAAAGgAAAAAA';
    base64ImageData = base64ImageData.substring(base64ImageData.indexOf(',') + 1); // Remove data URI prefix
    return EncodingUtil.base64Decode(base64ImageData);
}

 public static String generateAuthorizationHeader(String httpVerb, String contentMD5, String contentType, String fileName, String bucket, String secret, String access, string cdate) {
        String canonicalString = httpVerb + '\n' +
                                 contentMD5 + '\n' +
                                 contentType + '\n' +
                                 cdate + '\n' +
                                 '/' + bucket + '/' + fileName;
        Blob signature = Crypto.generateMac('HMACSHA1', Blob.valueOf(canonicalString), EncodingUtil.base64Decode(secret));
        String authHeader = 'AWS ' + access + ':' + EncodingUtil.base64Encode(signature);
        return authHeader;
    }


// public static String contentType(String fileType) {
//     switch on fileType.toLowerCase() {
//         when 'csv' {
//             return 'application/vnd.ms-excel';
//         }
//         when 'docx' {
//             return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
//         }
//         when 'wav' {
//             return 'audio/wav';
//         }
//         when 'pdf' {
//             return 'application/pdf';
//         }
//         when 'png' {
//             return 'image/png';
//         }
//         when else {
//             return 'image/jpeg';
//         }
//     }
// }

// public static String getFileExtension(String filePath) {
//     if (filePath != null && filePath.contains('.')) {
//         return filePath.substring(filePath.lastIndexOf('.') + 1);
//     }
//     return null;
// }



}