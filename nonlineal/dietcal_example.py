#!/usr/bin/env python
'''
Solves Using Gradient Parallelization

    min         p1*x1 + p2*x2 + ... + pn*xn , p1 ... pn from price array
    s.t.:   
	    CONS_LHS_MIN_1[0] <= x1 <= CONS_RHS_MAX_1[0]
	    CONS_LHS_MIN_1[1] <= x2 <= CONS_RHS_MAX_1[1]
            ....
	    CONS_LHS_MIN_1[n] <= Xn <= CONS_RHS_MAX_1[n]


            CONS_LHS_MIN_2[0] < DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn <= CONS_RHS_MAX_2[0]

	    -->
	     DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn - CONS_RHS_MAX_2[0] <=0
             &
	     -(DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn - CONS_LHS_MIN_2[0]) <0



	    100*CONS_LHS_MIN_2[1] < (DM[0]*NEL[0]*x1 + DM[1]*NEL[1]*x2 + ... + DM[n]*NEL[n]*xn) <= 100*CONS_RHS_MAX_2[1] 
                                _______________________________________________________
				             DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn 


            -->
	    100*CONS_LHS_MIN_2[1] < (DM[0]*NEL[0]*x1 + DM[1]*NEL[1]*x2 + ... + DM[n]*NEL[n]*xn) <= 100*CONS_RHS_MAX_2[1] 
                                _______________________________________________________
                                             DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn 


            (DM[0]*NEL[0]*x1 + DM[1]*NEL[1]*x2 + ... + DM[n]*NEL[n]*xn)      
            __________________________________________________________  - 100*CONS_RHS_MAX_2[1] <= 0
            DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn 


-->

(DM[0]*NUTRIENTS[0][0]*x1 + DM[1]*NUTRIENTS[0][1]*x2 + ... + DM[n]*NUTRIENTS[0][n]*xn)      
_____________________________________________________________________________________  - 100*CONS_RHS_MAX_2[1] <= 0
            DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn 



 	    (DM[0]*NEL[0]*x1 + DM[1]*NEL[1]*x2 + ... + DM[n]*NEL[n]*xn)      
         -   __________________________________________________________  + 100*CONS_RHS_MIN_2[1] <= 0
            DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn 




	    1000*CONS_LHS_MIN_2[1] < (DM[0]*NEL[0]*x1 + DM[1]*NEL[1]*x2 + ... + DM[n]*NEL[n]*xn) <= 1000*CONS_RHS_MAX_2[1] 
                                _______________________________________________________
                                             DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn 
 
	    

            

            x1 + 2.*x2 + 2.*x3 - 72 <= 0
            - x1 - 2.*x2 - 2.*x3 <= 0
            0 <= xi <= 42,  i = 1,2,3
    
    f* =  , x* = [,,]
'''
'''
#For taking local testing data
#from dietcal_example_data import *
'''
# =============================================================================
# Standard Python modules
# =============================================================================
import os, sys, time, json
import numpy as np
import decimal
import random
import logging

logging.basicConfig(filename='./python_dietcal_example.log',level=logging.DEBUG, format='%(asctime)s %(message)s')
logging.debug('                                      ')
logging.debug('                                      ')
logging.debug('                                      ')
logging.debug('                                      ')
logging.debug('                                      ')
logging.debug('New Run')


# FIXME:
# Load the data that PHP sent us
try:
    price_php = json.loads(sys.argv[1]) #convert to float
    DM_php = json.loads(sys.argv[2])
    CONS_RHS_MAX_1_php = json.loads(sys.argv[3]) #convert to int
    CONS_LHS_MIN_1_php = json.loads(sys.argv[4]) #convert to int
    CONS_RHS_MAX_2_php = json.loads(sys.argv[5]) #convert to int
    CONS_LHS_MIN_2_php = json.loads(sys.argv[6]) #convert to int
    NUTRIENTS_php = json.loads(sys.argv[7])
    SELECTED = json.loads(sys.argv[8])
except:
    logging.debug(sys.argv)
    print "ERROR"
    sys.exit(1)
# Generate some data to send to PHP
#print json.dumps(float(data[1])+float(data[2]))
#print json.dumps(price_php)

# end FIXME

def order_vector(vector):
    new_vector = []
    new_vector.append(vector[len(vector)-1])
    for i in range(0,len(vector)-1):
	new_vector.append(vector[i])
    return new_vector

CONS_RHS_MAX_2_php = order_vector(CONS_RHS_MAX_2_php)
CONS_LHS_MIN_2_php = order_vector(CONS_LHS_MIN_2_php)	


# =============================================================================
# External Python modules
# =============================================================================
try:
    from mpi4py import MPI

    comm = MPI.COMM_WORLD
    myrank = comm.Get_rank()

except:
    raise ImportError('mpi4py is required for parallelization')
#end



# =============================================================================
# Extension modules
# =============================================================================
#from pyOpt import *
from pyOpt import Optimization
from pyOpt import SLSQP

# =============================================================================
# 
# =============================================================================

def objfunc(x):
    f=0
    #f = -x[0]*x[1]*x[2]
    for i in range(len(price_php)):
        f=f+float(price_php[i])*x[i]
    #f = p1*x1 + p2*x2 + ... + pn*xn

    #g = [0.0]*2
    g = [0.0]*(len(NUTRIENTS_php[0])*2)

    #DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn - CONS_RHS_MAX_2[0] <=0
    g[0] = 0.00
    for i in range(len(DM_php)):
        g[0] = g[0] + DM_php[i]*x[i]
    g[0] = g[0] - 100*float(CONS_RHS_MAX_2_php[0])

    # -(DM[0]*x1 + DM[1]*x2 + ... + DM[n]*xn - CONS_LHS_MIN_2[0]) <0
    g[1] = 0.00
    for i in range(len(DM_php)):
        g[1] = g[1] + DM_php[i]*x[i]
    g[1] = -(g[1] - 100.00*float(CONS_LHS_MIN_2_php[0]))

    for j in range(2,len(NUTRIENTS_php[0])+1):
        g_index = (j-2)*2+2
        num = 0
        mult_const = 100.00
        divisor = float(CONS_LHS_MIN_2_php[0])

        for i in range(len(DM_php)):
                num = num + DM_php[i]*float(NUTRIENTS_php[i][j-2])*x[i]
        g[g_index] = num - divisor*mult_const*float(CONS_RHS_MAX_2_php[j-1])

        num = 0
        for i in range(len(DM_php)):
                num = num + DM_php[i]*float(NUTRIENTS_php[i][j-2])*x[i]
        g[g_index+1] = -(num - divisor*mult_const*float(CONS_LHS_MIN_2_php[j-1]))

    #time.sleep(0.5)
    fail = 0
    return f,g, fail


opt_prob = Optimization('TP37 Constrained Problem',objfunc)
#values = [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
for i in range(1,len(CONS_LHS_MIN_1_php)+1):
        x_value = 'x' + str(i)
        opt_prob.addVar(x_value,'c',lower=float(CONS_LHS_MIN_1_php[i-1]),upper=float(CONS_RHS_MAX_1_php[i-1]),value=random.uniform(0.1, 1.5) )
opt_prob.addObj('f')


for i in range(1,len(NUTRIENTS_php[0])*2+1):
        g_value = 'g' + str(i)
        opt_prob.addCon(g_value,'i')

# Instantiate Optimizer (SLSQP) 
slsqp = SLSQP()
slsqp.setOption('IPRINT',-1)



# Solve Problem (Without Parallel Gradient)
[fstr, xstr, inform] = slsqp(opt_prob,sens_type='CS')
if myrank == 0:
        sol = opt_prob.solution(0)
#end

xstr_array = []
for element in xstr:
        element = decimal.Decimal(element)
        xstr_array.append(round(element,4))


results_vector = []

results_vector.append(xstr_array)

fstr_array = []
for element in fstr:
        fstr_array.append(element)

results_vector.append(1)
results_vector.append(fstr_array[0])

'''
results_vector.append("----")
results_vector.append("Selected indexes")
results_vector.append(SELECTED)
results_vector.append("Price")
results_vector.append(price_php)
results_vector.append("DM_php")
results_vector.append(DM_php)
results_vector.append("CONS_RHS_MAX_1")
results_vector.append(CONS_RHS_MAX_1_php)
results_vector.append("CONS_RHS_MIN_1")
results_vector.append(CONS_LHS_MIN_1_php)
results_vector.append("CONS_RHS_MAX_2")
results_vector.append(CONS_RHS_MAX_2_php)
results_vector.append("CONS_RHS_MIN_2")
results_vector.append(CONS_LHS_MIN_2_php)
results_vector.append("NUTRIENTS")
results_vector.append(NUTRIENTS_php)
'''
print json.dumps(results_vector)
logging.debug(results_vector)
logging.debug("Finished run")

#print json.dumps(CONS_RHS_MAX_2_php)
# Solve Problem (With Parallel Gradient)
#slsqp(opt_prob,sens_type='CS',sens_mode='pgc')
#print opt_prob.solution(1)
