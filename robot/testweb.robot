*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${url}         http://cloud-test-env.eba-tpksyex2.us-east-1.elasticbeanstalk.com/
${Browser}     Chrome
${Delay}       5
${img}         C:\\Users\\Tawin\\Pictures\\Saved Pictures\\hehe2.jpg

*** Test Cases ***
1. Open Website
    Open Browser    ${url}    ${Browser}    options=add_experimental_option("excludeSwitches", ["enable-logging"])
    Set Selenium Speed    1

2. Create Account Page
     Click Link    Create new account

3. Input Account Information
    Choose File    xpath=//input[@type="file"]    ${img}
    Input Text    name=register_firstName       Firstname
    Input Text    name=register_lastName        Lastname
    Input Text    name=register_Email           test92@gmail.com
    Input Text    name=register_username        user92
    Input Text    name=register_Password        password
    Input Text    name=register_conPassword     password

4. Create Account
    Click Element    id=create-new-account

5. Input Email and Password
    Input Text    name=login_username    test92@gmail.com
    Input Text    name=login_password    password

6. Login
    Click Button    id=login-button

7. Go to Profile
    Click Link    id=profile_btn

8. Input Address
    Input Text    name=Address    Bangkok Thailand

9. Update Profile
    Click Button    id=btUpdatePic

10. Go to Home from Profile

    Click Element    xpath=//a[@class='logo' and @href='home']
 

11. Check History Page
    Click Element    xpath=//a[ @href='history']  

    Click Element    xpath=//a[ @href='history?stt=all']   
    Click Element    xpath=//a[ @href='history?stt=purchased']  
    Click Element    xpath=//a[ @href="history?stt=cancel"] 
    Click Element    xpath=//a[ @href="history?stt=refund"] 

    Click Element    xpath=//a[@class='logo' and @href='home']

12. Check Cart page
    Click Element    xpath=//a[ @href='cart']

    Click Element    xpath=//a[@class='logo' and @href='home']

13. Log Out
    Click Link    id=profile_btn
    Click Element    xpath=//a[ @href="logout"] 

14. Close Browser
    Close Browser
