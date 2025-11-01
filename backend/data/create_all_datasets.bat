@echo off
echo Creating all dataset files...

REM Heart Disease Dataset
(
echo age,sex,cp,trestbps,chol,fbs,restecg,thalach,exang,oldpeak,slope,ca,thal,target
echo 63,1,3,145,233,1,0,150,0,2.3,0,0,1,1
echo 37,1,2,130,250,0,1,187,0,3.5,0,0,2,1
echo 41,0,1,130,204,0,0,172,0,1.4,2,0,2,1
echo 56,1,1,120,236,0,1,178,0,0.8,2,0,2,1
echo 57,0,0,120,354,0,1,163,1,0.6,2,0,2,1
echo 57,1,0,140,192,0,1,148,0,0.4,1,0,1,1
echo 44,1,1,120,263,0,1,173,0,0,2,0,3,1
echo 52,1,2,172,199,1,1,162,0,0.5,2,0,3,1
echo 57,1,2,150,168,0,1,174,0,1.6,2,0,2,1
echo 54,1,0,140,239,0,1,160,0,1.2,2,0,2,1
echo 64,1,3,110,211,0,0,144,1,1.8,1,0,2,1
echo 58,0,3,150,283,1,0,162,0,1,2,0,2,1
echo 59,1,0,135,234,0,1,161,0,0.5,1,0,3,0
echo 44,1,2,130,233,0,1,179,1,0.4,2,0,2,0
echo 42,1,0,140,226,0,1,178,0,0,2,0,2,0
echo 61,1,2,150,243,1,1,137,1,1,1,0,2,0
echo 40,1,3,140,199,0,1,178,1,1.4,2,0,3,0
echo 59,1,2,150,212,1,1,157,0,1.6,2,0,2,0
echo 51,1,2,110,175,0,1,123,0,0.6,2,0,2,0
echo 65,0,2,140,417,1,0,157,0,0.8,2,1,2,0
) > heart.csv

REM Kidney Disease Dataset
(
echo age,bp,sg,al,su,rbc,bgr,bu,sc,hemo,wbcc,htn,dm,classification
echo 48,80,1.020,1,0,normal,121,36,1.2,15.4,7800,yes,yes,ckd
echo 53,90,1.020,2,0,abnormal,92,53,1.8,9.6,6900,yes,no,ckd
echo 63,70,1.010,3,0,abnormal,380,60,2.7,7.7,3800,yes,yes,ckd
echo 68,80,1.010,3,2,normal,157,90,4.1,7.1,9800,yes,yes,ckd
echo 25,80,1.020,0,0,normal,75,21,1.0,14.7,9200,no,no,notckd
echo 45,70,1.015,0,0,normal,117,15,0.8,13.5,7500,no,no,notckd
echo 38,70,1.020,0,0,normal,104,18,0.9,15.2,6200,no,no,notckd
echo 42,80,1.020,0,0,normal,89,17,0.7,16.1,7300,no,no,notckd
echo 35,80,1.015,0,0,normal,92,19,1.1,13.9,8100,no,no,notckd
echo 58,80,1.020,1,0,normal,131,28,1.4,12.4,6800,yes,no,ckd
echo 71,80,1.015,2,0,abnormal,162,54,2.1,10.2,4900,yes,yes,ckd
echo 55,90,1.015,3,0,abnormal,143,98,3.2,8.5,7200,yes,yes,ckd
echo 62,85,1.010,4,1,abnormal,201,112,5.3,7.9,5600,yes,yes,ckd
echo 47,75,1.020,0,0,normal,98,22,1.1,14.2,7900,no,no,notckd
echo 39,70,1.015,0,0,normal,87,16,0.9,15.6,7100,no,no,notckd
) > kidney_disease.csv

REM Breast Cancer Dataset
(
echo diagnosis,radius_mean,texture_mean,perimeter_mean,area_mean,smoothness_mean,compactness_mean,concavity_mean,concave_points_mean,symmetry_mean,fractal_dimension_mean
echo M,17.99,10.38,122.8,1001,0.1184,0.2776,0.3001,0.1471,0.2419,0.07871
echo M,20.57,17.77,132.9,1326,0.08474,0.07864,0.0869,0.07017,0.1812,0.05667
echo M,19.69,21.25,130,1203,0.1096,0.1599,0.1974,0.1279,0.2069,0.05999
echo M,11.42,20.38,77.58,386.1,0.1425,0.2839,0.2414,0.1052,0.2597,0.09744
echo M,20.29,14.34,135.1,1297,0.1003,0.1328,0.198,0.1043,0.1809,0.05883
echo B,13.08,15.71,85.63,520,0.1075,0.127,0.04568,0.0311,0.1967,0.06811
echo B,9.504,12.44,60.34,273.9,0.1024,0.06492,0.02956,0.02076,0.1815,0.06905
echo B,12.04,18.02,77.66,446.7,0.09746,0.06987,0.01628,0.01311,0.1863,0.06643
echo B,11.28,13.39,73,384.8,0.1164,0.1136,0.04635,0.04796,0.1771,0.06072
echo B,9.738,11.97,61.24,288.5,0.092,0.04062,0,0,0.1809,0.05883
) > breast_cancer.csv

echo.
echo ✓ heart.csv created
echo ✓ kidney_disease.csv created
echo ✓ breast_cancer.csv created
echo.
echo All datasets created successfully!
echo.
pause