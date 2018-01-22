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


def sqlite_query(sqlcmd, params=None, db_path=''):
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(sqlcmd, params)
        for row in cursor:
            yield row


def gen_condition(query, operator):
    conditions = []
    params = (query.strip(), )
    if "," in query:
        ch, en = [item.strip() for item in query.split(',', 1)]
        conditions.append("cphrasekey {} ?".format(operator))
        conditions.append("ephrase {} ?".format(operator))
        params = (ch, en)
    else:
        if isChinese(query.replace("%", "")):
            conditions.append("cphrasekey {} ?".format(operator))
        else:
            conditions.append("ephrase {} ?".format(operator))
    return ' and '.join(conditions), params


def get_phrase(query, offset=0):
    operator = 'like' if "%" in query else '='
    condition, params = gen_condition(query, operator)
    sqlcmd = "select * from phrase_table where {} order by min(pec, pce) desc limit 8 offset {};".format(condition, offset)
    result = [row for row in sqlite_query(sqlcmd, params, "phrase_table.db")]
    return result


def get_sentence(ch, en):
    sqlcmd = "select * from alignment where ' ' || chsent || ' ' like '% ' || ? || ' %' and ' ' || ensent || ' ' like '% ' || ? || ' %' limit 8;"
    result = [row for row in sqlite_query(sqlcmd,  (ch, en), "hkpt.alg.db")]
    return result


@app.route("/phrase", methods=['GET'])
def get_phrase_():
    q = request.args.get("q")
    offset = request.args.get("offset", 0)
    q = q.replace("*", "%")

    if not q:
        return Response('', mimetype="text/plain", status=404)

    result = get_phrase(q, offset)
    return jsonify(result)


@app.route("/sentence", methods=['GET'])
def get_sentence_():
    ch = request.args.get("ch")
    en = request.args.get("en")

    if ch is None and en is None:
        return Response('', mimetype="text/plain", status=404)

    result = get_sentence(ch, en)
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
