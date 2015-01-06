# build.sh
#
# Builds the web pages associated with the Dudley project
#

TEMPDIR=`mktemp -d`
dudley --source . --destination $TEMPDIR
git checkout gh-pages
cp -r $TEMPDIR/* .
rm -rf $TEMPDIR
git add --all
git commit -m "updated pages from source `date`" -a
git push origin gh-pages
git checkout gh-pages-source
