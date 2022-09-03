
#%%
import pandas as pd
import requests
import pandas as pd

#%% IMPORT DATA
# Original link is from here: http://irs-990-explorer.chrisgherbert.com/#aws-index-files
#Get Amazon URL's from here. Match with Probulica when filtered by city
path = 'https://s3.amazonaws.com/irs-form-990/index_2020.json'
r = requests.get(path)
data = r.json()['Filings2020']
df_index = pd.DataFrame.from_records( data )
df_index.head(5)
# %% 
#Masterfile
#https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf
#Tax exempts except 990N's
df_wy = pd.read_csv( r"C:\Users\csucuogl\Downloads\eo_wy.csv" )
df_id = pd.read_csv( r"C:\Users\csucuogl\Downloads\eo_id.csv" )
masterEO = df_wy.append(df_id)
masterEO.sample(15)

# %% 990N -> E-Postcards
# 990N has address information already. Not description but address at least


path = r"C:\Users\csucuogl\Downloads\data-download-epostcard\data-download-epostcard.txt"
with open(path, "r") as file_object:
    #print(file_object)
    data = file_object.read()

datas =  data.split("\n") 
datas = datas[2:]

data2 = [d.split("|") for d in datas]

# %%
pd.set_option('display.max_columns', None)
cols = ['EIN','year','org_name','T','F','date1','date2','email','name','address','address2','place','city','state','zip','country','alt_address','alt_address2','alt_city','alt_city','alt_state','alt_zip','alt_country','a1','a2','a3','a4','a5']

df_990N = pd.DataFrame(data=data2, columns = cols)
df_990N = df_990N[ df_990N['EIN']!="" ]
df_990N = df_990N.dropna(axis = 1,how='all')
df_990N = df_990N.dropna(axis = 0,how='all')

df_990N.head()

# %%
#12,000 enteirs in 990N in WY and ID
#14,500 enteries in 990 in MW and ID

df_990N_WY = df_990N[ df_990N['state'].isin(['WY','ID'])]

df_990N_WY = df_990N_WY['EIN	org_name	name	address\tplace	state	zip'.split('	')]
df_990N_WY.columns = 'EIN NAME ICO STREET CITY STATE ZIP'.split(' ')
masterEO = masterEO[ 'EIN	NAME	ICO	STREET	CITY	STATE	ZIP'.split('	') ]
masterEO.head(5)
df_990N_WY.head(5)
# %%

all_data = masterEO.append(df_990N_WY)
all_data['uid'] = [i for i in range(len(all_data))] 
all_data['Street address'] = all_data['STREET'] 
all_data['City'] = all_data['CITY']
all_data['State'] = all_data['STATE']
all_data['Zip Code'] = all_data['ZIP']

all_data = all_data[['uid','Street address','City','State','Zip Code']]
all_data.head()

# %%

def get_xy(address):
    # Convert spaces to plus signs
    address = address.replace(' ', '+')
    # Convert comma to %2C
    address = address.replace(',', '%2C')
    url = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address='+address+'&benchmark=4&vintage=4&format=json'
    #print (url)
    response = requests.get(url)
    data = response.json()
    #print(data)
    coordinates = data['result']['addressMatches'][0]['coordinates']
    lat = coordinates['y']
    lng = coordinates['x']

    return (lat,lng)

address = '1600 Pennsylvania Avenue NW, Washington, DC 20500'
get_xy(address)

# %%
import time

pobox = all_data[ all_data['Street address'].str.contains("PO BOX") ]
all_data = all_data[ ~ all_data['Street address'].str.contains("PO BOX") ]
all_data['lat']=None
all_data['lon']=None

#%%

for i,r in all_data.iterrows():
    if not r['lat']:
        address = r['Street address'] + ', ' + r['City'] + ', ' +r['State']+ ', ' + r['Zip Code']
        try:
            x,y = get_xy(address)
            all_data.loc[ all_data['uid']==r['uid'] , 'lat' ] = x
            all_data.loc[ all_data['uid']==r['uid'] , 'lon' ] = y

            time.sleep(1)
        except:
            print (r['uid'] , 'cant be done')

    if r['uid']%25==0:
        print (r['uid'])


# %%
#all_data = all_data.set_index("uid")

cutter = 6000
for i in range( int(len(all_data)/cutter)+1 ):
    low = i*cutter
    high = (i+1)*cutter
    print( low,high)

    all_data.drop(['lat','lon'],axis=1).iloc[0:cutter].to_csv( r"C:\Users\csucuogl\Downloads\grs\groups_{}.csv".format(i) )


# %%

import censusgeocode
df_all = pd.DataFrame()
cutter = 1000
for i in range( int(len(all_data)/cutter)+1 ):
    low = i*cutter
    high = (i+1)*cutter
    print( low,high)

    name = r"C:\Users\csucuogl\Downloads\grs\groups_{}.csv".format(i)
    all_data.drop(['lat','lon'],axis=1).iloc[low:high].to_csv( name ,header = False )

    cg = censusgeocode.CensusGeocode(benchmark='Public_AR_Current',vintage='Current_Current')
    k = cg.addressbatch( name )

    dfx = pd.DataFrame(k, columns=k[0].keys())
    df_all = df_all.append(dfx)


# %%

df_all.head()
# %%
df_all.to_csv(r'C:\Users\csucuogl\Desktop\BTNF\all_nonP.csv')
# %%

df = df_all[['id','address','lat','lon']]
df = df.dropna(subset=['lat','lon'],axis = 0)
df.head()

# %%

merge = masterEO.append(df_990N_WY)
merge['uid'] = [i for i in range(len(merge))]
merge['uid']=merge['uid'].astype(str)
merge = merge.drop(['ICO','ZIP'],axis = 1)
merge.head()
# %%

merge2 = merge.join( df.set_index('id'), on='uid' )
merge2 = merge2.dropna(subset=['lat'],axis = 0)

merge2.head()

# %%
len( merge2)
# %%
merge2.to_csv(r'C:\Users\csucuogl\Desktop\BTNF\all_nonP2.csv')

# %%

gr = pd.read_csv(r'C:\Users\csucuogl\Desktop\BTNF\all_nonP2.csv')
gr = gr.drop_duplicates(subset='NAME',keep='first')
gr = gr.sample(300)

gr = gr.sort_values(by='NAME')

for i,r in gr['NAME'].iteritems():
    print (r)

# %%
