import sys, json
import numpy as np


# Load the data that PHP sent us
try:
    data = json.loads(sys.argv[1])
except:
    print "ERROR"
    sys.exit(1)

# Generate some data to send to PHP
result = {'status': 'Yes!'}

#x = np.arange(data)
#x = np.arange(data[0],5.0,1.0)
#np.savetxt('/var/www/dairymgt-site/oldtools/DietFormulation/factory/test_auto.out',data, delimiter=',')


# Send it to stdout (to PHP)
print json.dumps(data)


