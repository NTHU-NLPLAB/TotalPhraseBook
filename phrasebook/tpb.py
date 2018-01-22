# -*- coding: utf-8 -*-
from flask import Flask, Response, jsonify, request, render_template
import re
import sqlite3

app = Flask(__name__)

pch = re.compile(u"^[\u4E00-\u9FA5 *,\d]+$")


def isChinese(s):
    if pch.findall(s) == []:
        return False
    else:
        return True


@app.route("/phrase", methods=['GET'])
def get_phrase():
    q = request.args.get("q")
    offset = request.args.get("offset")
    q = q.replace("*", "%")

    if not q:
        return Response('', mimetype="text/plain", status=404)

    opr = "like" if "%" else "="

    con = sqlite3.connect("phrase_table.db")
    cur = con.cursor()

    if "," in q:
        ch, en = [item.strip() for item in q.split(',', 1)]
        sql = "select * from phrase_table where cphrasekey %s ? and ephrase %s ? order by min(pec, pce) desc limit 8 offset %s;" % (
            opr, opr, offset)
        cur.execute(sql, [ch, en])

    else:
        if isChinese(q.replace("%", "")):
            ch = q.replace(" ", "")
            sql = "select * from phrase_table where cphrasekey %s ? order by min(pec, pce) desc limit 8 offset %s;" % (
                opr, offset)
            cur.execute(sql, [ch])
        else:
            en = q
            sql = "select * from phrase_table where ephrase %s ? order by min(pec, pce) desc limit 8 offset %s;" % (
                opr, offset)
            cur.execute(sql, [en])

    result = []
    for row in cur:
        result.append(row)
    return jsonify(result)


@app.route("/sentence", methods=['GET'])
def get_sentence():
    ch = request.args.get("ch")
    en = request.args.get("en")

    if ch is None and en is None:
        return Response('', mimetype="text/plain", status=404)

    con = sqlite3.connect("hkpt.alg.db")
    cur = con.cursor()
    sql = "select * from alignment where ' ' || chsent || ' ' like '% ' || ? || ' %' and ' ' || ensent || ' ' like '% ' || ? || ' %' limit 8;"
    cur.execute(sql, (ch, en))
    result = []
    for row in cur:
        result.append(row)
    return jsonify(result)


# index
@app.route("/", methods=['GET'])
def index():
    return render_template('index.html')


# serve static files
@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory('static', path)


if __name__ == "__main__":
    app.run()
