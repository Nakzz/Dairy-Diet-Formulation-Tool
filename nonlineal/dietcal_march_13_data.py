price_php = [
0.15,
0.35, 
0.34, 
0.35, 
0.21,
0.09,
0.04,
0.11,
0.65,
1.24,
0.52,
0.15,
0.1,
0.27,
0.27,
0.1,
0.24,
0.18,
0.17,
0.10,
0.38,
0.20,
0.59,
0.21,
0.14
]

DM_php= [
86,
89,
89,
87,
87,
87,
35,
89,
99,
94,
99,
89,
89,
89,
89,
89,
89,
89,
89,
89,
89,
89,
89,
89,
89
]

NEL = [ 
2.000,
2.200,
2.140,
2.750,
1.320,
1.100,
1.480,
5.620,
2.260,
0.010,
7.700,
0.020,
1.030,
3.080,
2.170,
1.650,
1.070,
1.390,
1.480,
1.890,
1.590,
1.760,
2.380,
1.780,
2.000
]


CP = [
9,
54,
50,
40,
20,
16,
7,
30,
0,
95,
287,
14,
24,
38,
45,
18.5,
24,
29,
10,
12,
32,
6,
65,
13,
14.2
]

NDF = [
9.5,
9.8,
14.9,
19.5,
40,
50,
42,
38.8,
0,
0,
0,
60.3,
35.5,
30,
30.8,
36.7,
50.3,
40.3,
45.8,
21.1,
36.1,
0.1,
11.1,
30,
13.4

]

RUP  = [
4.5,
21,
17.5,
12,
6,
4.8,
2.8,
15,
0,
76,
0,
6,
7.5,
17,
20,
4.5,
6,
8,
5,
4,
16,
2,
42,
4.5,
4.2
]

RDP = [
4.5,
33,
32.5,
28,
14,
11.2,
4.2,
15,
0,
19,
287,
8,
16.5,
21,
25,
14,
18,
21,
5,
8,
16,
4,
23,
8.5,
10
]


LIPID = [
4.2,
1.1,
1.6,
19,
2,
2,
3.2,
12,
100,
1.2,
0,
2.7,
3.5,
5.4,
1.9,
4.3,
19.3,
1.4,
1.1,
4.2,
1.7,
0.2,
2.5,
5.1,
2.3
]



PENDF = [
0,
0,
0,
0,
35,
50,
30,
0,
0,
0,
0,
0,
0,
0,
0,
0,
22,
0,
0,
0,
0,
0,
0,
0,
0
]


CA = [
0.04,
0.35,
0.4,
0.32,
1.3,
1,
0.28,
0.22,
0,
0.3,
0,
0.63,
0.7,
0.75,
0.2,
0.16,
0.17,
0.48,
0.91,
0.03,
0.4,
1,
0.06,
0.11,
0.05
]



PHOS = [
0.3,
0.7,
0.71,
0.6,
0.3,
0.28,
0.26,
0.83,
0,
0.3,
0,
0.17,
1,
1.1,
1.15,
1.18,
0.6,
1,
0.9,
0.65,
0.83,
0.1,
0.6,
0.4,
0.43
]

STARTCH = [
72,
2.7,
2.7,
10,
2.5,
2.5,
30,
2.5,
0,
0,
0,
5.3,
23.3,
1.5,
1.5,
29,
1,
6,
0.5,
31,
4,
5,
2.5,
47,
67
]

#Associated to Sol Constraints
CONS_RHS_MAX_1_php= [
8,
4,
4,
8,
2.3,
2.3,
18,
3.5,
0.5,
0.1,
0.1,
2,
4,
2,
2,
2,
3,
1,
2,
1,
2,
0.3,
1,
1,
2
]


#Associated to Nutrients Constraints
CONS_RHS_MAX_2_php = [
21.00, 1.76, 18.00, 35.00, 8.00, 12.0, 6.00, 28.00, 1.00, 0.45, 32.0
]


#Associated to Sol Constraints
CONS_LHS_MIN_1_php= [
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0,
0
]


#Associated to Nutriets Constraints
CONS_LHS_MIN_2_php = [
21.00,	1.65,	15.00,	25.00,	5.00,	10.0,	4.00,	17.50,	0.80,	0.35,	18.0
]


NUTRIENTS_php= []

#Nutrients grouping
NUTRIENTS_php.append(NEL)
NUTRIENTS_php.append(CP)
NUTRIENTS_php.append(NDF)
#NUTRIENTS.append(ADF)
NUTRIENTS_php.append(RUP)
NUTRIENTS_php.append(RDP)
NUTRIENTS_php.append(LIPID)
NUTRIENTS_php.append(PENDF)
NUTRIENTS_php.append(CA)
NUTRIENTS_php.append(PHOS)
#NUTRIENTS.append(LYS)
#NUTRIENTS.append(MET)
#NUTRIENTS.append(DNDF)
NUTRIENTS_php.append(STARTCH)
#NUTRIENTS.append(SUGAR)
NUTRIENTS_php.append(DM_php)


#check dimension correctness
len_ing_dif = 0
nel_len = len(NEL)
cp_len = len(CP)
ndf_len = len(NDF)
rup_len = len(RUP)
rdp_len = len(LIPID)
lipid_len = len(PENDF)
pendf_len = len(PENDF)
ca_len = len(CA)
phos_len = len(PHOS)
startch_len = len(STARTCH)
dm_len= len(DM_php)

len_ing_dif = cp_len - nel_len + cp_len - ndf_len + rup_len - rdp_len + lipid_len - pendf_len + ca_len - phos_len + startch_len - dm_len

#print "Ingredients len check: %d" % len_ing_dif
#print "NUTRIENTS_php len: %d " %len(NUTRIENTS_php)
#print "NUTRIENTS_php[0] len %d " %len(NUTRIENTS_php[0])
#print NUTRIENTS_php[9]
#print CONS_LHS_MIN_2_php
# Check f is calculated fine
#f=0
#for i in range(len(price_php)):
#        f=f+float(price_php[i])
#	print "i: %d" %i
#print "final f: %f" %f
#print "final f-Sum: %f" %sum(price_php)
