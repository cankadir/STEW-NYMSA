## Steps to Create a New Stew-LIVE Site  

#### Gather / Clean Data
1. 990 groups can be downloded here:   
  https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf  
2. Create the group list. You can use the Python code below to merge and clean the data:  
  https://github.com/PrattSAVI/STEW_EO_Extract/blob/main/PY/220222_FilterData.py  
  This will standardize the column names so it can be read in web interface as well. In this same repo, you can find the filtering codes for groups  
  https://github.com/PrattSAVI/STEW_EO_Extract/blob/main/DATA/FocusCodes.xls

#### Prepare Data for AGOL
3. Open data in ArcGIS Pro (JSON to feature)
4. Add Global IDS.
5. Right-Click on the Share > Web Layer > Publish Web Layer ( RMB > Sharing > Web Layer )  
  This allows exporting a single dataset.

#### AGOL
6. AGOL > Content, Check to see if the published data is there.
  Check True/False fields used to publis or not.

#### Survey123
7. Open Survey123 Connect (Desktop App)
8. New Survey > Feature Service > Find Your File > Create Survey
  Using an existing file to create the survey ensure data fields' compatibilty
9. In the XLS form change the order of questions, put labels and hide some questions.

| type     | name      | label                    |
|----------|-----------|--------------------------|
| text     | OrgName   | Name of the Organization |
| text     | OrgCity   | City                     |
| text     | OrgState  | State                    |
| text     | OrgZip    | Zipcode                  |
| text     | PrimFocus | Organization Focus       |
| geopoint | xxx       | Location                 |
| hidden   | From990s  | From990s                 |
| hidden   | lon       | lon                      |
| hidden   | lat       | lat                      |
| hidden   | Stew_Gr   | Stew_Gr                  |
| hidden   | PopID     | PopID                    |

10. Save and Publish. 
  This will create a new folder in your AGOL > Contents
11. Go to survey123.arcgis.com/ and find your survey, 
  Collaborate tab > Allow Add records
  
#### Adjust Data Settings
12. (**Optional**) AGOL > Find your feature layer (should have a pencil mark next to it now) > Settings > Enable editting > Keep track of when things are chagned > Save
13.  Create 2 views from the dataset. one for Accept=Y and one for Accept=N 
  Layer > Overview > Share > Everyone

#### Web App
14. Copy contents of https://github.com/cankadir/STEW-NYMSA/
15. Open config.js in a code editor. change center and survey name. 
16. You can launch the app on a local server

#### ArcGIS Developper
17. Go to developers.arcgis.com/ > Dashboard > OAuth 2.0 > New Application
  * Copy Client ID and update config.js
  * You might have to add the redirect urls from whereever you are serving the app from.
