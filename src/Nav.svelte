<nav class="uk-navbar-container" uk-navbar>
    <div class="uk-navbar-left">
        <div class="uk-navbar-toggle" uk-navbar-toggle-icon uk-toggle="target: #offcanvas-nav-primary"></div>
    </div>
    <div class="uk-navbar-item">
            <form action="javascript:void(0)">
                <input class="uk-input uk-form-width-small" type="text" placeholder="Input">
                <button class="uk-button uk-button-default">Button</button>
            </form>
        </div>
</nav>
<div id="offcanvas-nav-primary" uk-offcanvas="overlay: true">
    <div class="uk-offcanvas-bar uk-flex uk-flex-column">

        <ul class="uk-nav uk-nav-primary uk-nav-center uk-margin-auto-vertical">
            <li class="uk-active"><a href="">Active</a></li>
            <li class="uk-parent">
                <a href="">Parent</a>
                <ul class="uk-nav-sub">
                    <li><a href="">Sub item</a></li>
                    <li><a href="">Sub item</a></li>
                </ul>
            </li>
            <li class="uk-nav-header">Header</li>
            <li><a href=""><span class="uk-margin-small-right" uk-icon="icon: table"></span> Item</a></li>
            <li><a href=""><span class="uk-margin-small-right" uk-icon="icon: thumbnails"></span> Item</a></li>
            <li class="uk-nav-divider"></li>
            <li><a href=""><span class="uk-margin-small-right" uk-icon="icon: trash"></span> Item</a></li>
        </ul>

    </div>
</div>