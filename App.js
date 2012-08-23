Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: {
        type: 'vbox'
    },
    items:[
        {
            xtype: 'component',
            itemId: 'holder',
            autoEl: 'canvas',
            width: 400,
            height: 300,
            margin: '0 0 200 0'
        }
    ],

    buttons: [
        {
            itemId: 'resetView',
            text: 'Reset View'
        }
    ],

    launch: function() {
        var endDate = new Date();//Rally.util.DateTime.fromIsoString('2012-06-01T00:00:00Z');
        var startDate = Rally.util.DateTime.add(endDate, 'month', -3);
        var workspaceOID = this.getContext().getWorkspace().ObjectID;
        var projectOID = this.getContext().getProject().ObjectID;

        // TODO make this configurable
        var openStates = ["Submitted", "Open"];

        //TODO remove this and use the standard store when the new Lookback API url format is online
        Ext.define('Rally.data.lookback.SnapshotStoreOldUrl', {
            extend: 'Rally.data.lookback.SnapshotStore',

            constructor: function(config) {
                this.callParent([config]);
                // temporary override needed since new URL format not deployed yet
                this.proxy.url = Rally.environment.getServer().getLookbackUrl(1.37) + '/' +
                        Rally.util.Ref.getOidFromRef(this.context.workspace) + '/artifact/snapshot/query';
            }
        });


        var snapshotStore = Ext.create('Rally.data.lookback.SnapshotStoreOldUrl', {
                autoLoad: true,
                context: {
                    workspace: ('/workspace/'+ workspaceOID),
                    project: ('/project/'+ projectOID)
                },
                sorters: [
                    {
                        property: 'ObjectID',
                        direction: 'ASC'
                    },
                    {
                        property: '_ValidFrom',
                        direction: 'ASC'
                    }
                ],
                hydrate: ['Priority'],
                fetch: ['ObjectID', 'Priority'],

                // look for snapshots of defects that changed State
                filters: [
                    { property: '_Type', value: 'Defect' },
                    { property: 'State', operator: 'in', value: openStates },
                    { property: '_PreviousValues.State', operator: 'exists', value: true }
                ],
                //limit: Infinity,

                listeners: {
                    load: this.onStoreLoad,
                    scope: this
                }
        });

        this.loadModel();
    },

    loadModel: function(){
        // ensure the callback is propertly scoped
        var callback = Ext.bind(this.createScene, this);

        // var jsonLoader = new THREE.JSONLoader();
        // jsonLoader.load( './resources/heart_with_normals.json', callback);
        //jsonLoader.load( './resources/exported/heart.js', callback);
        // jsonLoader.load( './resources/Heart3.js', callback);
        var loader = new THREE.ColladaLoader();
        //loader.load('./resources/Heart3.dae', callback);
        loader.load('./resources/other/Heart_other2_centered.dae', callback);

        /*
        Ext.Ajax.request({
            url: './resources/heart_with_normals.obj',
            callback: function(opts, success, response) {
                if(success || response.status === 0){
                    this.parseModelFromObj(response.responseText);
                }
                else{
                    console.log('server-side failure with status code ' + response.status);
                }
            },
            scope: this
        });
        */

    },

    parseModelFromObj: function(objFileText){
        console.log(objFileText);
    },

    onStoreLoad: function(store, records){
        // var holder = this.down('#holder');
        // holder.add({
        //     xype: 'label',
        //     html: 'Got '+ records.length +' records'
        // });
    },

    createScene: function(colladaObj){

        // set the scene size
        var WIDTH = 400,
            HEIGHT = 300;

        // set some camera attributes
        var VIEW_ANGLE = 45,
            ASPECT = WIDTH / HEIGHT,
            NEAR = 0.1,
            FAR = 10000;

        // get the DOM element to attach to
        var holder = this.down('#holder').getEl().dom;

        // create a renderer with antialiasing on
        this.glRenderer = new THREE.WebGLRenderer({
            canvas: holder,
            antialias: true
        });

        this.glRenderer.setClearColorHex(0x000000, 1.0);
        this.glRenderer.clear();

        this.camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
                                        ASPECT,
                                        NEAR,
                                        FAR  );
        this.scene = new THREE.Scene();

        // the camera starts at 0,0,0 so pull it back
        this.cameraDistance = 500;
        this.camera.position.z = this.cameraDistance;

        // start the renderer
        this.glRenderer.setSize(WIDTH, HEIGHT);

        // attach the render-supplied DOM element
        //holder.appendChild(this.glRenderer.domElement);

        // create the mesh from the geometry
        this.mesh = this.createHeartMesh(colladaObj);

        // set the geometry to dynamic
        // so that it allow updates
        //this.mesh.geometry.dynamic = true;

        //mesh.position.set( 0, 16, 0 );
        this.mesh.scale.set( 1, 1, 1 );

        this.scene.add(this.mesh);
        this.scene.add(this.camera);

        // add some lights
        var ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(ambientLight);
        // var pointLight = this.createPointLight(0xFFFFFF, 10, 100, 130);
        var pointLight = this.createPointLight(0xFFFFFF, 10, 150, -100);
        this.scene.add(pointLight);

        // make the camera controllable with the mouse
        this.mouseControls = new THREE.TrackballControls(this.camera, this.glRenderer.domElement);

        // draw the scene
        this.glRenderer.render(this.scene, this.camera);

        // ensure the callback is scoped correctly
        this.updateCallback = Ext.bind(this.update, this);
        this.update(null);

        
        // this.mouseControls.rotateSpeed = 1.0;
        // this.mouseControls.zoomSpeed = 1.2;
        // this.mouseControls.panSpeed = 0.2;

        // this.mouseControls.noZoom = false;
        // this.mouseControls.noPan = false;

        // this.mouseControls.staticMoving = false;
        // this.mouseControls.dynamicDampingFactor = 0.3;

        // this.mouseControls.minDistance = radius * 1.1;
        // this.mouseControls.maxDistance = radius * 100;

        // this.mouseControls.keys = [ 65, 83, 68 ]; // [ rotateKey, zoomKey, panKey ]
    },

    createHeartMesh: function(colladaObj){
        var mesh = colladaObj.scene;

        // rotate and position to be the right way up
        mesh.rotation.x = -Math.PI/2;
        // mesh.position.x = -100;
        mesh.rotation.z = -Math.PI/2;

        var heartMaterial = new THREE.MeshLambertMaterial({
            //color: 0xCC0000
            color: 0x0000FF
        });

        var children = mesh.children[0].children;
        var l = children.length;
        for(var i=0; i < l; ++i){
            children[i].material = heartMaterial;
        }

        return mesh;
    },

    createPointLight: function(color, x, y, z){
        // create a point light
        var pointLight = new THREE.PointLight(color);

        // set its position
        pointLight.position.x = x;
        pointLight.position.y = y;
        pointLight.position.z = z;

        return pointLight;
    },

    update: function(timestamp){
        var step;
        if(!timestamp){
            this.animStart = new Date();
            step = 0;
        }
        else{
            step = timestamp - this.animStart;
        }

        var TWO_PI = 2.0 * Math.PI;

        // total time for the heartbeat + rest animation
        var animationPeriod = 2000;
        
        // heartbeat cycle every second
        var heartbeatPeriod = 1000;

        // rest for reaminder
        var restPeriod = animationPeriod - heartbeatPeriod;

        var animationTime =  step % animationPeriod;

        // complete a heartbeat cycle every 2 seconds
        //var heartbeatPeriod = 1500;
        var heartbeatAngle = (TWO_PI * animationTime) / heartbeatPeriod;
        var heartbeatScale = 0.1;

        var scale = animationTime > heartbeatPeriod ? 1.0 : 1.0 + (heartbeatScale * Math.abs( Math.sin(heartbeatAngle) ) );

        var xScale = scale;
        var yScale = xScale;
        var zScale = scale;
        this.mesh.scale.set(xScale, yScale, zScale);

        // spin the camera in a circle
        // this.camera.position.x = Math.sin(step/1000) * this.cameraDistance;
        // this.camera.position.z = Math.cos(step/1000) * this.cameraDistance;
        // // you need to update lookAt every frame
        // this.camera.lookAt(this.scene.position);

        this.mouseControls.update();
        this.glRenderer.render(this.scene, this.camera);

        requestAnimationFrame(this.updateCallback, this.glRenderer.domElement);
    },

    createSphereMesh: function(){
        // create the sphere's material
        var sphereMaterial = new THREE.MeshLambertMaterial(
        {
            color: 0xCC0000
        });

        // set up the sphere vars
        var radius = 50, segments = 16, rings = 16;
        var sphereGeometry = new THREE.SphereGeometry(radius, segments, rings);

        // create a new mesh with sphere geometry
        var mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        return mesh;
    }
});