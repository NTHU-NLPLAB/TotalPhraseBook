from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from phrasebook.tpb import get_phrase, get_sentence


# Create your views here.
def phrase_view(request, query):
    if request.method == 'GET':
        offset = request.GET.get('offset', 0)
        query = query.replace("*", "%")

        if not query:
            return HttpResponse(status=404)

        result = get_phrase(query, offset)
        return JsonResponse(result)
    else:
        return HttpResponse(status=404)


def sentence_view(request):
    if request.method == 'GET':
        ch = request.GET.get("ch")
        en = request.GET.get("en")

        if ch is None and en is None:
            return HttpResponse(status=404)

        result = get_sentence(ch, en)
        return JsonResponse(result)
    else:
        return HttpResponse(status=404)


def index(request):
    return render(request, 'index.html')
