# build.sh
#
# Builds the web pages associated with the Dudley project
#

TEMPDIR=`mktemp -d`
dudley --source . --destination $TEMPDIR
git checkout gh-pages
cp -r $TEMPDIR/* .
