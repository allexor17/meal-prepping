#!/bin/sh
# Netlify: scarica Oblò dal suo repository (allexor17/Oblo) nella cartella lavatrice/
# alla versione indicata in oblo.ref. Così ogni app ha il suo repository e il sito le pubblica insieme.
set -e
REF=$(tr -d ' \n' < oblo.ref)
rm -rf lavatrice
git clone --quiet https://github.com/allexor17/Oblo lavatrice
git -C lavatrice -c advice.detachedHead=false checkout --quiet "$REF"
rm -rf lavatrice/.git
echo "Oblò pubblicata alla versione $REF"
