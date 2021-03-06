package services.dotcomponents

import experiments.{ActiveExperiments, Control, DotcomponentsRendering, Excluded, Participant}
import model.PageWithStoryPackage
import play.api.mvc.RequestHeader
import services.dotcomponents.pickers.{RenderTierPickerStrategy, SimplePagePicker, WhitelistPicker}
import implicits.Requests._

object RenderingTierPicker {

  val picker: RenderTierPickerStrategy = new SimplePagePicker()

  def logRequest(msg:String, results:List[(String, Boolean)])(implicit request: RequestHeader): Unit =
    DotcomponentsLogger().withRequestHeaders(request).results(msg, results)

  def getRenderTierFor(page: PageWithStoryPackage)(implicit request: RequestHeader): RenderType = {

    // all requests with ?guui automatically get remotely rendered

    if(request.isGuui) {
      return RemoteRender
    }

    // log out whenever we find a supported article, for metrics purposes

    val (results, isSupported) = picker.getRenderTierFor(page, request)

    isSupported match {
      case RemoteRender => logRequest("Article was remotely renderable", results)
      case _ => logRequest("Article was only locally renderable", results)
    }

    // We use dotcomponents if we are in the AB test, and are a supported article according to the picker

    ActiveExperiments.groupFor(DotcomponentsRendering) match {
      case Participant => isSupported
      case Control => LocalRender
      case Excluded => LocalRender
    }

  }

}
